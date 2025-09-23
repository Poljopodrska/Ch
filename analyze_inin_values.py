#!/usr/bin/env python3
"""
Analyze ININ values and quantities to understand what amounts we're dealing with
"""
import os
import glob
import re

def analyze_inin_values():
    """Extract and analyze values from ININ files"""
    os.chdir('/mnt/c/Users/HP/Ch/work_files/inin_data/inin')
    
    inin_data = {}
    
    # Process all ININ files
    for file in glob.glob('*.txt'):
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        lines = content.strip().split('\n')
        if lines and lines[0].startswith('DOC'):
            header_parts = lines[0].split(';')
            if len(header_parts) >= 5:
                delivery_note = header_parts[2]
                
                # Calculate total quantity from items
                total_quantity = 0
                items = []
                
                for line in lines[1:]:
                    if line.startswith('ITM1'):
                        item_parts = line.split(';')
                        if len(item_parts) >= 4:
                            product_code = item_parts[1]
                            # Quantity is in format with comma as decimal separator
                            qty_str = item_parts[3].replace(',', '.')
                            try:
                                quantity = float(qty_str)
                                total_quantity += quantity
                                items.append({
                                    'product': product_code,
                                    'quantity': quantity
                                })
                            except:
                                pass
                
                inin_data[delivery_note] = {
                    'file': file,
                    'supplier': header_parts[1],
                    'date': header_parts[3],
                    'total_quantity': total_quantity,
                    'item_count': len(items),
                    'items': items
                }
    
    return inin_data

def check_suspicious_matches():
    """Check which delivery notes appear in multiple invoices"""
    os.chdir('/mnt/c/Users/HP/Ch/work_files/racuni_data/Racuni')
    
    # Get ININ data first
    inin_data = analyze_inin_values()
    
    # Track where each delivery note appears
    delivery_note_occurrences = {}
    
    for xml_file in glob.glob('*.xml'):
        with open(xml_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Get invoice amount
        amount = None
        amount_match = re.search(r'<ZnesekRacuna>([^<]+)</ZnesekRacuna>', content)
        if not amount_match:
            # Try P-series pattern
            amount_matches = re.findall(r'<D_5004>([0-9]+\.?[0-9]*)</D_5004>', content)
            if amount_matches:
                try:
                    amounts = [float(a.replace(',', '.')) for a in amount_matches]
                    amount = max(amounts) if amounts else None
                except:
                    pass
        else:
            try:
                amount = float(amount_match.group(1).replace(',', '.'))
            except:
                pass
        
        # Check each ININ delivery note
        for delivery_note in inin_data.keys():
            if delivery_note in content:
                if delivery_note not in delivery_note_occurrences:
                    delivery_note_occurrences[delivery_note] = []
                delivery_note_occurrences[delivery_note].append({
                    'invoice': xml_file,
                    'amount': amount
                })
    
    print("="*80)
    print("SUSPICIOUS MATCH ANALYSIS")
    print("="*80)
    
    # Find suspicious ones (appearing in multiple invoices)
    suspicious_count = 0
    legitimate_count = 0
    
    print("\n🔴 HIGHLY SUSPICIOUS (appears in multiple invoices):")
    print("-"*60)
    
    for dn, occurrences in delivery_note_occurrences.items():
        if len(occurrences) > 1:
            suspicious_count += 1
            inin_info = inin_data[dn]
            print(f"\nDelivery Note: '{dn}' - appears in {len(occurrences)} invoices!")
            print(f"  ININ quantity: {inin_info['total_quantity']:.2f} units")
            print(f"  ININ items: {inin_info['item_count']}")
            
            # Show invoice amounts
            amounts = [occ['amount'] for occ in occurrences if occ['amount']]
            if amounts:
                print(f"  Invoice amounts: {', '.join([f'€{a:,.2f}' for a in amounts[:5]])}")
                print(f"  Amount range: €{min(amounts):,.2f} - €{max(amounts):,.2f}")
            
            # Check if amounts make sense
            if amounts and inin_info['total_quantity'] > 0:
                avg_amount = sum(amounts) / len(amounts)
                # Rough estimate: if average price per unit
                estimated_unit_price = avg_amount / inin_info['total_quantity']
                if estimated_unit_price > 1000:  # More than €1000 per unit seems high
                    print(f"  ⚠️ WARNING: Implied unit price €{estimated_unit_price:.2f} seems unrealistic!")
    
    print(f"\n\n🟢 LEGITIMATE MATCHES (single invoice only):")
    print("-"*60)
    
    for dn, occurrences in delivery_note_occurrences.items():
        if len(occurrences) == 1:
            legitimate_count += 1
            inin_info = inin_data[dn]
            occ = occurrences[0]
            
            print(f"\nDelivery Note: '{dn}'")
            print(f"  ININ quantity: {inin_info['total_quantity']:.2f} units")
            print(f"  Invoice: {occ['invoice']}")
            if occ['amount']:
                print(f"  Invoice amount: €{occ['amount']:,.2f}")
                
                # Check if amount is reasonable
                if inin_info['total_quantity'] > 0:
                    unit_price = occ['amount'] / inin_info['total_quantity']
                    print(f"  Implied unit price: €{unit_price:.2f}")
            
            if legitimate_count >= 5:  # Just show first 5
                break
    
    print("\n" + "="*80)
    print("SUMMARY:")
    print("="*80)
    print(f"🔴 Suspicious matches (multiple invoices): {suspicious_count}")
    print(f"🟢 Legitimate matches (single invoice): {legitimate_count}")
    print(f"\nRECOMMENDATION: Reject matches where delivery note appears in >1 invoice")
    
    # Show which ones are the false positives
    print("\n" + "="*80)
    print("FALSE POSITIVE ANALYSIS:")
    print("="*80)
    
    for dn, occurrences in sorted(delivery_note_occurrences.items(), key=lambda x: len(x[1]), reverse=True)[:3]:
        if len(occurrences) > 10:
            print(f"\n'{dn}' appears in {len(occurrences)} invoices - DEFINITELY NOT A DELIVERY NOTE!")
            print(f"This is probably a product code, postal code, or other reference number.")

if __name__ == "__main__":
    analyze_inin_values()
    check_suspicious_matches()