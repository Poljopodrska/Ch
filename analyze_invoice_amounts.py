#!/usr/bin/env python3
"""
Comprehensive invoice amount extraction for both XML formats
"""
import os
import re
import glob

def extract_38xxx_amounts(content):
    """Extract amounts from 38xxx format (IzdaniRacunEnostavni)"""
    result = {
        'format': 'IzdaniRacunEnostavni (38xxx)',
        'invoice_number': None,
        'date': None,
        'supplier': None,
        'net_amount': None,
        'vat_amount': None,
        'total_amount': None,
        'vat_rate': None
    }
    
    # Extract invoice number
    inv_match = re.search(r'<StevilkaRacuna>([^<]+)</StevilkaRacuna>', content)
    if inv_match:
        result['invoice_number'] = inv_match.group(1)
    
    # Extract date
    date_match = re.search(r'<DatumRacuna>([^<]+)</DatumRacuna>', content)
    if date_match:
        result['date'] = date_match.group(1)[:10]
    
    # Extract supplier
    supplier_match = re.search(r'<NazivPartnerja1>([^<]+)</NazivPartnerja1>', content)
    if supplier_match:
        result['supplier'] = supplier_match.group(1)
    
    # Extract all amounts with their type codes
    amounts = re.findall(r'<VrstaZneska>(\d+)</VrstaZneska>\s*<ZnesekRacuna>([^<]+)</ZnesekRacuna>', content, re.DOTALL)
    
    for code, amount in amounts:
        amount_float = float(amount.replace(',', '.'))
        
        # Common eSLOG amount type codes:
        if code == '9':  # Total amount to be paid
            result['total_amount'] = amount_float
        elif code == '79':  # Total without VAT
            result['net_amount'] = amount_float
        elif code == '86':  # Total line items
            if not result['net_amount']:
                result['net_amount'] = amount_float
        elif code == '176':  # VAT amount (sometimes)
            # This might not have a value
            pass
    
    # Calculate VAT if we have both total and net
    if result['total_amount'] and result['net_amount']:
        result['vat_amount'] = result['total_amount'] - result['net_amount']
        if result['net_amount'] > 0 and result['vat_amount'] > 0:
            result['vat_rate'] = (result['vat_amount'] / result['net_amount']) * 100
    
    return result

def extract_p_series_amounts(content):
    """Extract amounts from P-series format (eSLOG 2.00)"""
    result = {
        'format': 'eSLOG 2.00 (P-series)',
        'invoice_number': None,
        'date': None,
        'supplier': None,
        'net_amount': None,
        'vat_amount': None,
        'total_amount': None,
        'vat_rate': None
    }
    
    # Extract invoice number
    inv_match = re.search(r'<D_1004>([^<]+)</D_1004>', content)
    if inv_match:
        result['invoice_number'] = inv_match.group(1)
    
    # Extract date
    date_match = re.search(r'<D_2380>([^<]+)</D_2380>', content)
    if date_match:
        result['date'] = date_match.group(1)[:10]
    
    # Extract supplier
    supplier_match = re.search(r'<D_3036>([^<]+)</D_3036>', content)
    if supplier_match:
        result['supplier'] = supplier_match.group(1)
    
    # Extract monetary amounts with their qualifiers
    # Look for MOA segments with qualifiers
    moa_segments = re.findall(r'<S_MOA>.*?<D_5025>(\d+)</D_5025>.*?<D_5004>([^<]+)</D_5004>.*?</S_MOA>', content, re.DOTALL)
    
    for qualifier, amount in moa_segments:
        amount_float = float(amount.replace(',', '.'))
        
        # Common MOA qualifiers:
        if qualifier == '9':  # Total amount
            result['total_amount'] = amount_float
        elif qualifier == '79':  # Total without tax
            result['net_amount'] = amount_float
        elif qualifier == '125':  # Taxable amount
            if not result['net_amount']:
                result['net_amount'] = amount_float
        elif qualifier == '176':  # Tax amount
            result['vat_amount'] = amount_float
    
    # If no MOA segments found, try simple extraction
    if not result['total_amount']:
        all_amounts = re.findall(r'<D_5004>([0-9]+\.?[0-9]*)</D_5004>', content)
        if all_amounts:
            amounts_float = [float(a.replace(',', '.')) for a in all_amounts]
            # Assume largest amount is total
            result['total_amount'] = max(amounts_float)
    
    # Calculate VAT if we have both total and net
    if result['total_amount'] and result['net_amount']:
        result['vat_amount'] = result['total_amount'] - result['net_amount']
        if result['net_amount'] > 0 and result['vat_amount'] > 0:
            result['vat_rate'] = (result['vat_amount'] / result['net_amount']) * 100
    
    return result

def analyze_invoice(filepath):
    """Analyze a single invoice file"""
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    filename = os.path.basename(filepath)
    
    # Determine format and extract
    if filename.startswith('38'):
        return extract_38xxx_amounts(content)
    elif filename.startswith('P'):
        return extract_p_series_amounts(content)
    else:
        # Try both formats
        if '<IzdaniRacunEnostavni' in content:
            return extract_38xxx_amounts(content)
        elif '<M_INVOIC' in content:
            return extract_p_series_amounts(content)
        else:
            return {'format': 'Unknown', 'error': 'Could not determine format'}

def main():
    os.chdir('/mnt/c/Users/HP/Ch/work_files/racuni_data/Racuni')
    
    print("="*80)
    print("COMPREHENSIVE INVOICE FINANCIAL ANALYSIS")
    print("="*80)
    
    # Analyze a sample of invoices
    files = glob.glob('38*.xml')[:5] + glob.glob('P*.xml')[:5]
    
    for filepath in files:
        print(f"\n{os.path.basename(filepath)}")
        print("-"*60)
        
        result = analyze_invoice(filepath)
        
        print(f"Format: {result['format']}")
        print(f"Invoice #: {result['invoice_number']}")
        print(f"Date: {result['date']}")
        print(f"Supplier: {result['supplier']}")
        print(f"\nFinancial breakdown:")
        
        if result.get('net_amount') is not None:
            print(f"  Net Amount:   €{result['net_amount']:,.2f}")
        
        if result.get('vat_amount') is not None and result['vat_amount'] > 0:
            print(f"  VAT Amount:   €{result['vat_amount']:,.2f}")
            if result.get('vat_rate'):
                print(f"  VAT Rate:     {result['vat_rate']:.1f}%")
        
        if result.get('total_amount') is not None:
            print(f"  Total Amount: €{result['total_amount']:,.2f}")
        
        if result.get('net_amount') == result.get('total_amount'):
            print("  Note: This appears to be a VAT-exempt invoice")
        
        if result.get('error'):
            print(f"  Error: {result['error']}")
    
    print("\n" + "="*80)
    print("SUMMARY:")
    print("- Some invoices include VAT (e.g., 38274_1.xml with 15.9% VAT)")
    print("- Some invoices are VAT-exempt (net = total)")
    print("- P-series files often don't separate VAT clearly")
    print("="*80)

if __name__ == "__main__":
    main()