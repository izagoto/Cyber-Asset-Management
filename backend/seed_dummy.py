import random
from datetime import datetime, timedelta, timezone
from app.core.database import SessionLocal
from app.models.asset import Asset, AssetStatus
from app.models.loan import Loan, LoanStatus

def seed_dummy_data():
    db = SessionLocal()
    
    print("Checking if data already exists...")
    if db.query(Asset).count() > 0:
        print("Assets already exist. Wiping data for a fresh seed...")
        db.query(Loan).delete()
        db.query(Asset).delete()
        db.commit()

    print("Seeding dummy assets...")
    
    # 1. Create a variety of Assets
    assets_data = [
        {"name": "MacBook Pro 16\"", "category": "Laptop", "sn": "SN-MAC-001", "desc": "High-end developer machine", "qty": 5, "status": AssetStatus.AVAILABLE},
        {"name": "ThinkPad T14", "category": "Laptop", "sn": "SN-THINK-002", "desc": "Standard corporate laptop", "qty": 10, "status": AssetStatus.AVAILABLE},
        {"name": "YubiKey 5 NFC", "category": "Security", "sn": "SN-YUBI-101", "desc": "Hardware authentication token", "qty": 20, "status": AssetStatus.AVAILABLE},
        {"name": "Cisco Meraki MR46", "category": "Network", "sn": "SN-MR46-201", "desc": "Wi-Fi 6 Access Point", "qty": 3, "status": AssetStatus.MAINTENANCE},
        {"name": "FortiGate 60F", "category": "Network", "sn": "SN-FG-301", "desc": "Next-Gen Firewall", "qty": 2, "status": AssetStatus.AVAILABLE},
        {"name": "iPad Pro 11\"", "category": "Tablet", "sn": "SN-IPAD-401", "desc": "For field researchers", "qty": 4, "status": AssetStatus.AVAILABLE},
        {"name": "Dell UltraSharp 27\"", "category": "Monitor", "sn": "SN-DELL-501", "desc": "4K USB-C Monitor", "qty": 15, "status": AssetStatus.AVAILABLE},
        {"name": "Hak5 WiFi Pineapple", "category": "Security", "sn": "SN-HAK5-601", "desc": "Network auditing tool", "qty": 2, "status": AssetStatus.LOST},
    ]

    db_assets = []
    for a in assets_data:
        asset_status = a["status"]
        status_val = asset_status.value if hasattr(asset_status, 'value') else str(asset_status)
        asset = Asset(
            name=str(a["name"]),
            category=str(a["category"]),
            serial_number=str(a["sn"]),
            description=str(a["desc"]),
            quantity=int(a["qty"]),
            status=status_val
        )
        db.add(asset)
        db_assets.append(asset)
    
    db.commit()
    for a in db_assets:
        db.refresh(a)
    
    print("Seeding dummy loans...")
    
    # 2. Create some dummy loans to make the dashboard look active
    now = datetime.now(timezone.utc)
    
    # Let's borrow some of the MacBooks
    macbook = db_assets[0]
    loan1 = Loan(
        user_id=1,  # Assuming James Bond is user 1
        asset_id=macbook.id,
        quantity=1,
        status=LoanStatus.ACTIVE.value,
        purpose='{"borrower_name": "John Doe", "borrower_division": "Incident Response", "borrower_phone": "+62 811-123-456", "borrower_email": "john.doe@cybersec.com", "loan_date": "' + now.strftime("%Y-%m-%d") + '", "return_date": "' + (now + timedelta(days=7)).strftime("%Y-%m-%d") + '", "reason": "Forensic analysis off-site"}',
        requested_at=now - timedelta(days=2),
        approved_at=now - timedelta(days=2)
    )
    db.add(loan1)

    # Someone requested a ThinkPad but it's pending
    thinkpad = db_assets[1]
    loan2 = Loan(
        user_id=1,
        asset_id=thinkpad.id,
        quantity=2,
        status=LoanStatus.REQUESTED.value,
        purpose='{"borrower_name": "Jane Smith", "borrower_division": "IT Support", "borrower_phone": "+62 822-987-654", "borrower_email": "jane.smith@cybersec.com", "loan_date": "' + (now + timedelta(days=1)).strftime("%Y-%m-%d") + '", "return_date": "' + (now + timedelta(days=14)).strftime("%Y-%m-%d") + '", "reason": "New employee onboarding devices"}',
        requested_at=now - timedelta(hours=5)
    )
    db.add(loan2)
    
    # Overdue iPad
    ipad = db_assets[5]
    loan3 = Loan(
        user_id=1,
        asset_id=ipad.id,
        quantity=1,
        status="OVERDUE",
        purpose='{"borrower_name": "Alice Wonderland", "borrower_division": "Field Ops", "borrower_phone": "+62 833-111-222", "borrower_email": "alice@cybersec.com", "loan_date": "' + (now - timedelta(days=10)).strftime("%Y-%m-%d") + '", "return_date": "' + (now - timedelta(days=2)).strftime("%Y-%m-%d") + '", "reason": "Client site survey"}',
        requested_at=now - timedelta(days=11),
        approved_at=now - timedelta(days=10)
    )
    db.add(loan3)
    
    # Returned YubiKeys
    yubikey = db_assets[2]
    loan4 = Loan(
        user_id=1,
        asset_id=yubikey.id,
        quantity=5,
        status=LoanStatus.RETURNED.value,
        purpose='{"borrower_name": "Bob Builder", "borrower_division": "Engineering", "borrower_phone": "+62 844-333-444", "borrower_email": "bob@cybersec.com", "loan_date": "' + (now - timedelta(days=20)).strftime("%Y-%m-%d") + '", "return_date": "' + (now - timedelta(days=15)).strftime("%Y-%m-%d") + '", "reason": "Security seminar distribution"}',
        requested_at=now - timedelta(days=21),
        approved_at=now - timedelta(days=21),
        returned_at=now - timedelta(days=15)
    )
    db.add(loan4)

    db.commit()
    print("✅ Dummy data seeding completed successfully!")
    print("You can now view the Dashboard and it should be populated.")

if __name__ == "__main__":
    seed_dummy_data()
