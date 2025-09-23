#!/usr/bin/env python3
"""
Comprehensive study to find delivery note patterns in CSB invoices
This will analyze ALL possible locations where delivery notes might appear
"""
import os
import re
import glob
from collections import defaultdict

def extract_all_potential_delivery_notes(content, filename):
    """Extract all potential delivery note references from an invoice"""
    findings = {
        'filename': filename,
        'format': 'P-series' if filename.startswith('P') else '38xxx',
        'delivery_notes': [],
        'reference_docs': [],
        'free_text': [],
        'special_fields': [],
        'numeric_patterns': [],
        'suspicious_strings': []
    }
    
    # 1. Check ReferencniDokumenti (Reference Documents)
    ref_docs = re.findall(r'<ReferencniDokumenti[^>]*>(.*?)</ReferencniDokumenti>', content, re.DOTALL)
    for ref in ref_docs:
        doc_num = re.search(r'<StevilkaDokumenta>([^<]+)</StevilkaDokumenta>', ref)
        doc_type = re.search(r'VrstaDokumenta="([^"]+)"', ref)
        if doc_num:
            findings['reference_docs'].append({
                'number': doc_num.group(1),
                'type': doc_type.group(1) if doc_type else 'Unknown'
            })
    
    # 2. Check PoljubnoBesedilo (Free Text Fields)
    free_texts = re.findall(r'<PoljubnoBesedilo>(.*?)</PoljubnoBesedilo>', content, re.DOTALL)
    for text_block in free_texts:
        text_content = re.search(r'<Tekst\d+>([^<]+)</Tekst\d+>', text_block)
        if text_content and text_content.group(1).strip():
            findings['free_text'].append(text_content.group(1))
    
    # 3. Check OpisArtikla (Article Descriptions)
    descriptions = re.findall(r'<OpisArtikla\d+>([^<]+)</OpisArtikla\d+>', content)
    for desc in descriptions:
        if desc and 'Invoice' not in desc:  # Skip generic invoice descriptions
            findings['special_fields'].append(('OpisArtikla', desc))
    
    # 4. Check for FTX segments (P-series free text)
    ftx_segments = re.findall(r'<S_FTX>(.*?)</S_FTX>', content, re.DOTALL)
    for ftx in ftx_segments:
        text_fields = re.findall(r'<D_4440>([^<]+)</D_4440>', ftx)
        for text in text_fields:
            if text.strip():
                findings['free_text'].append(text)
    
    # 5. Check RFF segments (P-series references)
    rff_segments = re.findall(r'<S_RFF>(.*?)</S_RFF>', content, re.DOTALL)
    for rff in rff_segments:
        ref_num = re.search(r'<D_1154>([^<]+)</D_1154>', rff)
        ref_qual = re.search(r'<D_1153>([^<]+)</D_1153>', rff)
        if ref_num:
            findings['special_fields'].append((
                f'RFF_{ref_qual.group(1) if ref_qual else "Unknown"}',
                ref_num.group(1)
            ))
    
    # 6. Look for specific delivery note patterns
    # Common patterns: DN####, DL####, dobavnica, Dob., etc.
    delivery_patterns = [
        (r'DN[\s-]?[\d]{4,8}', 'DN_pattern'),
        (r'DL[\s-]?[\d]{4,8}', 'DL_pattern'),
        (r'[Dd]obavnica[\s:]*([^\s<]+)', 'Dobavnica'),
        (r'[Dd]ob\.?[\s:]*([^\s<]+)', 'Dob_short'),
        (r'[Dd]elivery[\s-]?[Nn]ote[\s:]*([^\s<]+)', 'Delivery_Note'),
        (r'[Ll]ieferung[\s:]*([^\s<]+)', 'German_Delivery'),
        (r'[Bb]olge[\s:]*([^\s<]+)', 'Bolge'),
        (r'[Pp]revzemnica[\s:]*([^\s<]+)', 'Prevzemnica'),
        (r'[Oo]dpremnica[\s:]*([^\s<]+)', 'Odpremnica'),
    ]
    
    for pattern, pattern_name in delivery_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            findings['delivery_notes'].append({
                'pattern': pattern_name,
                'value': match if isinstance(match, str) else match[0]
            })
    
    # 7. Extract suspicious numeric patterns that could be delivery notes
    # Look for 6-8 digit numbers that aren't amounts or dates
    numeric_patterns = re.findall(r'\b\d{6,8}\b', content)
    
    # Filter out obvious non-delivery-note numbers
    for num in numeric_patterns:
        # Skip if it's a date (YYYYMMDD or similar)
        if num.startswith('202'):
            continue
        # Skip if it's in an amount field
        if f'>{num}<' in content and ('Znesek' in content[max(0, content.index(f'>{num}<')-50):content.index(f'>{num}<')]):
            continue
        # Skip VAT numbers and similar
        if 'SI' + num in content or 'DE' + num in content:
            continue
        
        # Check context around the number
        idx = content.find(num)
        context = content[max(0, idx-100):idx+100]
        
        # Look for delivery-related keywords nearby
        if any(keyword in context.lower() for keyword in ['dob', 'del', 'prev', 'odp', 'ship', 'tras', 'list']):
            findings['suspicious_strings'].append({
                'number': num,
                'context': context.replace('\n', ' ').strip()
            })
        elif len(findings['numeric_patterns']) < 10:  # Limit to avoid too many false positives
            findings['numeric_patterns'].append(num)
    
    # 8. Check BGM segment for document references (P-series)
    bgm_match = re.search(r'<S_BGM>(.*?)</S_BGM>', content, re.DOTALL)
    if bgm_match:
        doc_num = re.search(r'<D_1004>([^<]+)</D_1004>', bgm_match.group(1))
        if doc_num:
            findings['special_fields'].append(('BGM_DocumentNumber', doc_num.group(1)))
    
    # 9. Check DTM segments for associated dates that might have references
    dtm_segments = re.findall(r'<S_DTM>(.*?)</S_DTM>', content, re.DOTALL)
    for dtm in dtm_segments:
        qualifier = re.search(r'<D_2005>([^<]+)</D_2005>', dtm)
        if qualifier and qualifier.group(1) in ['35', '11', '171']:  # Delivery date codes
            date_val = re.search(r'<D_2380>([^<]+)</D_2380>', dtm)
            if date_val:
                findings['special_fields'].append((f'DTM_{qualifier.group(1)}_DeliveryDate', date_val.group(1)))
    
    return findings

def analyze_all_invoices():
    """Analyze all invoices to find delivery note patterns"""
    os.chdir('/mnt/c/Users/HP/Ch/work_files/racuni_data/Racuni')
    
    all_files = glob.glob('*.xml')
    results = []
    
    # Pattern statistics
    pattern_stats = defaultdict(int)
    field_stats = defaultdict(set)
    
    print("="*80)
    print("COMPREHENSIVE DELIVERY NOTE EXTRACTION STUDY")
    print("="*80)
    print(f"\nAnalyzing {len(all_files)} invoice files...")
    
    for filepath in all_files:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        findings = extract_all_potential_delivery_notes(content, os.path.basename(filepath))
        results.append(findings)
        
        # Update statistics
        if findings['delivery_notes']:
            for dn in findings['delivery_notes']:
                pattern_stats[dn['pattern']] += 1
        
        for field_type, value in findings['special_fields']:
            field_stats[field_type].add(value)
    
    # Print detailed analysis
    print("\n" + "="*80)
    print("FINDINGS SUMMARY")
    print("="*80)
    
    # 1. Files with potential delivery notes
    files_with_dn = [r for r in results if r['delivery_notes']]
    print(f"\nFiles with delivery note patterns: {len(files_with_dn)}/{len(results)}")
    
    if files_with_dn:
        print("\nExamples of found delivery notes:")
        for result in files_with_dn[:5]:
            print(f"\n{result['filename']}:")
            for dn in result['delivery_notes']:
                print(f"  - {dn['pattern']}: {dn['value']}")
    
    # 2. Pattern statistics
    if pattern_stats:
        print("\n" + "-"*50)
        print("Delivery Note Pattern Frequency:")
        for pattern, count in sorted(pattern_stats.items(), key=lambda x: x[1], reverse=True):
            print(f"  {pattern}: {count} occurrences")
    
    # 3. Reference documents analysis
    files_with_refs = [r for r in results if r['reference_docs']]
    print(f"\n" + "-"*50)
    print(f"Files with reference documents: {len(files_with_refs)}/{len(results)}")
    
    if files_with_refs:
        print("\nReference document types found:")
        ref_types = defaultdict(list)
        for result in files_with_refs:
            for ref in result['reference_docs']:
                ref_types[ref['type']].append(ref['number'])
        
        for doc_type, numbers in ref_types.items():
            print(f"  Type '{doc_type}': {len(numbers)} documents")
            print(f"    Examples: {', '.join(numbers[:3])}")
    
    # 4. Free text analysis
    files_with_text = [r for r in results if r['free_text']]
    print(f"\n" + "-"*50)
    print(f"Files with free text fields: {len(files_with_text)}/{len(results)}")
    
    # Look for delivery-related keywords in free text
    delivery_keywords_found = []
    for result in files_with_text:
        for text in result['free_text']:
            if any(kw in text.lower() for kw in ['dobav', 'deliv', 'prevz', 'odprem', 'ship']):
                delivery_keywords_found.append((result['filename'], text))
    
    if delivery_keywords_found:
        print(f"\nFree text with delivery keywords: {len(delivery_keywords_found)} instances")
        for filename, text in delivery_keywords_found[:3]:
            print(f"  {filename}: {text[:100]}...")
    
    # 5. Special fields analysis
    print(f"\n" + "-"*50)
    print("Special fields that might contain delivery notes:")
    for field_type, values in field_stats.items():
        if len(values) > 0 and len(values) < 50:  # Skip if too many unique values
            print(f"\n{field_type}: {len(values)} unique values")
            sample = list(values)[:3]
            for val in sample:
                print(f"  - {val}")
    
    # 6. Suspicious numeric patterns
    files_with_suspicious = [r for r in results if r['suspicious_strings']]
    if files_with_suspicious:
        print(f"\n" + "-"*50)
        print(f"Files with suspicious numeric patterns: {len(files_with_suspicious)}")
        for result in files_with_suspicious[:3]:
            print(f"\n{result['filename']}:")
            for susp in result['suspicious_strings'][:2]:
                print(f"  Number: {susp['number']}")
                print(f"  Context: ...{susp['context'][:100]}...")
    
    return results

def find_inin_patterns():
    """Also check what delivery note formats exist in ININ files"""
    inin_dir = '/mnt/c/Users/HP/Ch/work_files/racuni_data/Prejemi'
    if os.path.exists(inin_dir):
        os.chdir(inin_dir)
        
        print("\n" + "="*80)
        print("ININ DELIVERY NOTE PATTERNS")
        print("="*80)
        
        inin_files = glob.glob('*.txt')[:20]
        delivery_notes = set()
        
        for filepath in inin_files:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # ININ format: second semicolon-separated field is usually delivery note
            lines = content.split('\n')
            if lines:
                parts = lines[0].split(';')
                if len(parts) > 2:
                    delivery_notes.add(parts[2])
        
        print(f"\nFound {len(delivery_notes)} unique delivery notes in ININ files:")
        for dn in sorted(list(delivery_notes))[:20]:
            print(f"  - {dn}")
            
        # Analyze the pattern
        if delivery_notes:
            print("\nDelivery note patterns in ININ:")
            # Check if numeric
            numeric_dns = [dn for dn in delivery_notes if dn.isdigit()]
            alpha_dns = [dn for dn in delivery_notes if not dn.isdigit()]
            
            print(f"  Numeric only: {len(numeric_dns)}")
            if numeric_dns:
                print(f"    Examples: {', '.join(numeric_dns[:5])}")
                lengths = [len(dn) for dn in numeric_dns]
                print(f"    Length range: {min(lengths)}-{max(lengths)} digits")
            
            print(f"  Alphanumeric: {len(alpha_dns)}")
            if alpha_dns:
                print(f"    Examples: {', '.join(alpha_dns[:5])}")

if __name__ == "__main__":
    # First analyze CSB invoices
    results = analyze_all_invoices()
    
    # Then check ININ patterns
    find_inin_patterns()
    
    print("\n" + "="*80)
    print("CONCLUSION")
    print("="*80)
    print("""
The delivery notes appear to be:
1. NOT in standard XML fields for most invoices
2. Possibly in PDF attachments referenced in the XML
3. May be in free text fields for some invoices
4. ININ uses numeric delivery notes (6-8 digits typically)
5. Need to search entire XML content for ININ delivery note numbers
""")