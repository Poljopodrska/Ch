#!/usr/bin/env python3
"""
Test the exact matching logic locally to verify the count
"""
import os
import glob
import re

def load_inin_delivery_notes():
    """Load all delivery notes from ININ files"""
    os.chdir('/mnt/c/Users/HP/Ch/work_files/inin_data/inin')
    
    inin_delivery_notes = {}
    all_inin_files = glob.glob('*.txt')
    
    for file in all_inin_files:
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        lines = content.strip().split('\n')
        if lines and lines[0].startswith('DOC'):
            parts = lines[0].split(';')
            if len(parts) >= 5:
                supplier_code = parts[1]
                delivery_note = parts[2]
                date = parts[3]
                goods_receipt = parts[4]
                
                inin_delivery_notes[delivery_note] = {
                    'file': file,
                    'supplier_code': supplier_code,
                    'date': date,
                    'goods_receipt': goods_receipt
                }
    
    return inin_delivery_notes

def search_csb_for_delivery_notes(inin_delivery_notes):
    """Search CSB invoices for ININ delivery notes"""
    os.chdir('/mnt/c/Users/HP/Ch/work_files/racuni_data/Racuni')
    
    all_csb_files = glob.glob('*.xml')
    matches = []
    invoice_to_delivery = {}  # Track which invoices have which delivery notes
    
    print(f"Searching {len(all_csb_files)} CSB invoices for {len(inin_delivery_notes)} ININ delivery notes...")
    
    for csb_file in all_csb_files:
        with open(csb_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Get invoice number
        invoice_num = re.search(r'<StevilkaRacuna>([^<]+)</StevilkaRacuna>', content)
        invoice_num = invoice_num.group(1) if invoice_num else csb_file
        
        # Check each ININ delivery note
        found_in_this_invoice = []
        for delivery_note in inin_delivery_notes.keys():
            if delivery_note in content:
                found_in_this_invoice.append(delivery_note)
                matches.append({
                    'invoice': csb_file,
                    'invoice_num': invoice_num,
                    'delivery_note': delivery_note,
                    'inin_data': inin_delivery_notes[delivery_note]
                })
        
        if found_in_this_invoice:
            invoice_to_delivery[csb_file] = found_in_this_invoice
    
    return matches, invoice_to_delivery

def analyze_matches(matches, invoice_to_delivery, inin_delivery_notes):
    """Analyze the matching results"""
    print("\n" + "="*80)
    print("MATCHING ANALYSIS RESULTS")
    print("="*80)
    
    # Count unique values
    unique_delivery_notes_matched = set(m['delivery_note'] for m in matches)
    unique_invoices_matched = set(m['invoice'] for m in matches)
    
    print(f"\nTotal ININ delivery notes: {len(inin_delivery_notes)}")
    print(f"Total matches found: {len(matches)}")
    print(f"Unique delivery notes matched: {len(unique_delivery_notes_matched)}")
    print(f"Unique invoices with matches: {len(unique_invoices_matched)}")
    
    # Check for duplicates
    print("\n" + "-"*50)
    print("DUPLICATE ANALYSIS:")
    print("-"*50)
    
    # Check if one delivery note appears in multiple invoices
    delivery_to_invoices = {}
    for match in matches:
        dn = match['delivery_note']
        inv = match['invoice']
        if dn not in delivery_to_invoices:
            delivery_to_invoices[dn] = []
        delivery_to_invoices[dn].append(inv)
    
    duplicates = {dn: invs for dn, invs in delivery_to_invoices.items() if len(invs) > 1}
    if duplicates:
        print(f"\n⚠️ {len(duplicates)} delivery notes appear in MULTIPLE invoices:")
        for dn, invs in list(duplicates.items())[:5]:
            print(f"  Delivery note '{dn}' appears in {len(invs)} invoices:")
            for inv in invs[:3]:
                print(f"    - {inv}")
    else:
        print("✅ No delivery notes appear in multiple invoices")
    
    # Check if one invoice has multiple delivery notes
    multi_dn_invoices = {inv: dns for inv, dns in invoice_to_delivery.items() if len(dns) > 1}
    if multi_dn_invoices:
        print(f"\n📦 {len(multi_dn_invoices)} invoices contain MULTIPLE delivery notes:")
        for inv, dns in list(multi_dn_invoices.items())[:5]:
            print(f"  Invoice {inv} has {len(dns)} delivery notes: {', '.join(dns[:5])}")
    
    # Sample of actual matches
    print("\n" + "-"*50)
    print("SAMPLE MATCHES (first 10):")
    print("-"*50)
    for match in matches[:10]:
        print(f"\n✓ Match found:")
        print(f"  Delivery Note: {match['delivery_note']}")
        print(f"  Invoice: {match['invoice']} (#{match['invoice_num']})")
        print(f"  ININ Receipt: {match['inin_data']['goods_receipt']}")
        print(f"  Date: {match['inin_data']['date']}")
    
    # Unmatched ININ
    unmatched_inin = set(inin_delivery_notes.keys()) - unique_delivery_notes_matched
    print(f"\n" + "-"*50)
    print(f"UNMATCHED ININ: {len(unmatched_inin)} delivery notes not found in any CSB invoice")
    if unmatched_inin:
        print("Examples:", list(unmatched_inin)[:10])
    
    return len(matches), len(unique_delivery_notes_matched), len(unique_invoices_matched)

def main():
    print("="*80)
    print("LOCAL MATCHING TEST - EXACT REPLICATION OF FINANCE MODULE LOGIC")
    print("="*80)
    
    # Load ININ delivery notes
    inin_delivery_notes = load_inin_delivery_notes()
    print(f"\nLoaded {len(inin_delivery_notes)} ININ delivery notes")
    
    # Search CSB invoices
    matches, invoice_to_delivery = search_csb_for_delivery_notes(inin_delivery_notes)
    
    # Analyze results
    total_matches, unique_dns, unique_invoices = analyze_matches(matches, invoice_to_delivery, inin_delivery_notes)
    
    print("\n" + "="*80)
    print("FINAL COMPARISON WITH MARINA'S RESULT:")
    print("="*80)
    print(f"Marina reports: 130 matches")
    print(f"Our analysis: {total_matches} total matches")
    print(f"  - {unique_dns} unique delivery notes matched")
    print(f"  - {unique_invoices} unique invoices with matches")
    
    if total_matches > 130:
        print(f"\n⚠️ OVER-COUNTING DETECTED!")
        print(f"The system might be counting duplicates.")
        print(f"Likely issue: Same delivery note in multiple places or")
        print(f"multiple delivery notes per invoice being counted separately.")
    elif total_matches < 130:
        print(f"\n⚠️ We found fewer matches than Marina!")
        print(f"The Finance module might be finding matches we're missing here.")
    else:
        print(f"\n✅ Match count agrees with Marina's report!")

if __name__ == "__main__":
    main()