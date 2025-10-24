"""
Convert Bank Data Excel files to JSON for Payment Manager
Processes receivables, payables, and customer profiles
"""

import pandas as pd
import json
from datetime import datetime
import numpy as np

def convert_receivables():
    """Convert receivables (terjatve) to JSON"""
    print("📊 Converting Receivables...")

    # Load receivables
    df = pd.read_excel('/mnt/c/Users/HP/Ch/BankData/terjtave PIvka 22.10.25.xlsx')

    # Fix column names (first row contains actual headers)
    df.columns = df.iloc[0]
    df = df[1:].reset_index(drop=True)

    # Load customer payment profiles for matching
    profiles = pd.read_excel('/mnt/c/Users/HP/Ch/BankData/customer_payment_profiles.xlsx')
    profiles_dict = profiles.set_index('customer_name').to_dict('index')

    receivables = []
    today = datetime.now()

    for idx, row in df.iterrows():
        try:
            customer_name = str(row['pp_ime']).strip()
            invoice = str(row['oznaka'])
            amount = float(row['saldo'])

            # Skip if amount is zero or negative
            if amount <= 0:
                continue

            # Parse dates
            due_date = pd.to_datetime(row['datum_valute'])
            invoice_date = pd.to_datetime(row['datum_fakture']) if pd.notna(row['datum_fakture']) else due_date

            # Calculate days until due
            days_until_due = (due_date - today).days
            days_overdue = max(0, -days_until_due)

            # Get customer profile if exists
            profile = profiles_dict.get(customer_name, None)

            if profile:
                avg_payment_delay = profile['avg_payment_delay']
                reliability = profile['reliability_score']
                contractual_terms = int(profile['avg_promised_delay'])
            else:
                # Defaults for customers without history
                avg_payment_delay = 35
                reliability = 50
                contractual_terms = 30

            # Calculate expected payment date
            expected_payment_date = due_date + pd.Timedelta(days=int(avg_payment_delay))

            # Determine status
            if days_overdue > 0:
                status = f"Overdue {days_overdue}d"
                status_type = "overdue"
            elif days_until_due <= 7:
                status = f"Due in {days_until_due}d"
                status_type = "due_soon"
            else:
                status = "On track"
                status_type = "ok"

            receivables.append({
                'id': f"RECV-{idx}",
                'customer_name': customer_name,
                'invoice': invoice,
                'amount': round(amount, 2),
                'due_date': due_date.strftime('%Y-%m-%d'),
                'invoice_date': invoice_date.strftime('%Y-%m-%d'),
                'days_until_due': days_until_due,
                'days_overdue': days_overdue,
                'status': status,
                'status_type': status_type,
                'contractual_terms': contractual_terms,
                'avg_payment_delay': round(avg_payment_delay, 1),
                'expected_payment_date': expected_payment_date.strftime('%Y-%m-%d'),
                'reliability': round(reliability, 0),
                'account': str(row['konto'])
            })

        except Exception as e:
            print(f"  Warning: Skipping row {idx}: {e}")
            continue

    print(f"  ✓ Converted {len(receivables)} receivables")
    return receivables


def convert_payables():
    """Convert payables (obveznosti) to JSON"""
    print("\n💳 Converting Payables...")

    # Load payables
    df = pd.read_excel('/mnt/c/Users/HP/Ch/BankData/obveznosti PIvka 22.10.25.xlsx')

    # Fix column names
    df.columns = df.iloc[0]
    df = df[1:].reset_index(drop=True)

    # Load customer payment profiles for supplier matching
    profiles = pd.read_excel('/mnt/c/Users/HP/Ch/BankData/customer_payment_profiles.xlsx')
    profiles_dict = profiles.set_index('customer_name').to_dict('index')

    payables = []
    today = datetime.now()

    for idx, row in df.iterrows():
        try:
            supplier_name = str(row['pp_ime']).strip()
            invoice = str(row['oznaka'])
            amount = float(row['saldo'])

            # Skip if amount is zero or negative
            if amount <= 0:
                continue

            # Parse dates
            due_date = pd.to_datetime(row['datum_valute'])

            # Calculate days until due
            days_until_due = (due_date - today).days
            days_overdue = max(0, -days_until_due)

            # Get supplier profile if exists (using same profiles)
            profile = profiles_dict.get(supplier_name, None)

            if profile:
                avg_payment_delay = profile['avg_payment_delay']
            else:
                avg_payment_delay = 0  # Default: pay on time

            # Determine default urgency based on amount and days until due
            if amount > 50000 or days_until_due <= 7:
                default_urgency = "urgent"
            elif amount > 20000:
                default_urgency = "conditional"
            else:
                default_urgency = "flexible"

            # Determine status
            if days_overdue > 0:
                status = f"Overdue {days_overdue}d"
                status_type = "overdue"
            elif days_until_due <= 7:
                status = f"Due in {days_until_due}d"
                status_type = "due_soon"
            else:
                status = "On track"
                status_type = "ok"

            payables.append({
                'id': f"OBLIG-{idx}",
                'supplier_name': supplier_name,
                'invoice': invoice,
                'amount': round(amount, 2),
                'due_date': due_date.strftime('%Y-%m-%d'),
                'days_until_due': days_until_due,
                'days_overdue': days_overdue,
                'status': status,
                'status_type': status_type,
                'urgency': default_urgency,  # Default, can be changed by user
                'actual_pay_date': None,  # Will be calculated based on urgency
                'account': str(row['konto']),
                'avg_payment_delay': round(avg_payment_delay, 1) if profile else 0
            })

        except Exception as e:
            print(f"  Warning: Skipping row {idx}: {e}")
            continue

    print(f"  ✓ Converted {len(payables)} payables")
    return payables


def main():
    print("="*80)
    print("🏦 Bank Data to JSON Converter")
    print("="*80)
    print()

    # Convert receivables
    receivables = convert_receivables()

    # Convert payables
    payables = convert_payables()

    # Save to JSON files
    output_dir = '/mnt/c/Users/HP/Ch/BankData'

    print("\n💾 Saving JSON files...")

    # Save receivables
    receivables_file = f"{output_dir}/receivables_data.json"
    with open(receivables_file, 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now().isoformat(),
            'total_count': len(receivables),
            'total_amount': sum(r['amount'] for r in receivables),
            'receivables': receivables
        }, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Saved: {receivables_file}")

    # Save payables
    payables_file = f"{output_dir}/payables_data.json"
    with open(payables_file, 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now().isoformat(),
            'total_count': len(payables),
            'total_amount': sum(p['amount'] for p in payables),
            'payables': payables
        }, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Saved: {payables_file}")

    # Generate summary
    print("\n" + "="*80)
    print("✅ Conversion Complete!")
    print("="*80)
    print(f"\n📊 Receivables:")
    print(f"   Total: {len(receivables)} invoices")
    print(f"   Amount: €{sum(r['amount'] for r in receivables):,.2f}")
    overdue_recv = [r for r in receivables if r['days_overdue'] > 0]
    print(f"   Overdue: {len(overdue_recv)} invoices (€{sum(r['amount'] for r in overdue_recv):,.2f})")

    print(f"\n💳 Payables:")
    print(f"   Total: {len(payables)} invoices")
    print(f"   Amount: €{sum(p['amount'] for p in payables):,.2f}")
    overdue_pay = [p for p in payables if p['days_overdue'] > 0]
    print(f"   Overdue: {len(overdue_pay)} invoices (€{sum(p['amount'] for p in overdue_pay):,.2f})")

    print(f"\n📁 Files ready for Payment Manager:")
    print(f"   - {receivables_file}")
    print(f"   - {payables_file}")
    print()


if __name__ == "__main__":
    main()
