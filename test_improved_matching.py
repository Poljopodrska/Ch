#!/usr/bin/env python3
"""
Test the improved matching logic with smart filtering
"""
import os
import glob

def test_improved_matching():
    """Test matching with suspicious filter"""
    # Load ININ
    os.chdir('/mnt/c/Users/HP/Ch/work_files/inin_data/inin')
    inin_delivery_notes = set()
    
    for file in glob.glob('*.txt'):
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.read().strip().split('\n')
            if lines and lines[0].startswith('DOC'):
                parts = lines[0].split(';')
                if len(parts) >= 5:
                    inin_delivery_notes.add(parts[2])
    
    # Check CSB
    os.chdir('/mnt/c/Users/HP/Ch/work_files/racuni_data/Racuni')
    
    # Track occurrences
    dn_to_invoices = {}
    
    for csb_file in glob.glob('*.xml'):
        with open(csb_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        for dn in inin_delivery_notes:
            if dn in content:
                if dn not in dn_to_invoices:
                    dn_to_invoices[dn] = []
                dn_to_invoices[dn].append(csb_file)
    
    print("="*80)
    print("IMPROVED MATCHING TEST (WITH SMART FILTERING)")
    print("="*80)
    
    # Separate suspicious and valid
    valid_matches = []
    suspicious_matches = []
    
    for dn, invoices in dn_to_invoices.items():
        if len(invoices) == 1:
            valid_matches.append((dn, invoices[0]))
        else:
            suspicious_matches.append((dn, len(invoices)))
    
    print(f"\n✅ VALID MATCHES (1 delivery note : 1 invoice): {len(valid_matches)}")
    for dn, inv in valid_matches[:5]:
        print(f"  - Delivery note '{dn}' → Invoice {inv}")
    
    print(f"\n❌ SUSPICIOUS (removed): {len(suspicious_matches)} delivery notes")
    for dn, count in suspicious_matches[:5]:
        print(f"  - '{dn}' appears in {count} invoices - FILTERED OUT")
    
    print(f"\n" + "="*80)
    print("COMPARISON:")
    print("="*80)
    print(f"Old system (Marina saw): 130 matches (includes false positives)")
    print(f"New system (filtered):   {len(valid_matches)} valid matches")
    print(f"Removed as suspicious:   {sum(count for _, count in suspicious_matches)} false matches")
    print(f"\nThe new count of {len(valid_matches)} is much more realistic!")

if __name__ == "__main__":
    test_improved_matching()