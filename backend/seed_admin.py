from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.category import Category
from app.models.borrower import Borrower
from app.core.security import hash_password

def seed_database():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    print("Seeding users...")
    hashed_pass = hash_password("Jbond123!")

    admin = User(
        email="cybersecurity@gmail.com",
        fullname="James Bond",
        password_hash=hashed_pass,
        role="ADMIN",
        division="Cyber Security Researcher",
        phone="+62 811-2222-3333"
    )

    db.add(admin)
    
    print("Seeding categories...")
    default_categories = [
        Category(name="Laptop", description="Laptops and notebooks"),
        Category(name="Desktop", description="Desktop computers"),
        Category(name="Monitor", description="Monitors and displays"),
        Category(name="Keyboard", description="Keyboards"),
        Category(name="Mouse", description="Computer mice"),
        Category(name="Printer", description="Printers and scanners"),
        Category(name="Network", description="Networking equipment"),
        Category(name="Server", description="Servers and rack equipment"),
        Category(name="Software", description="Software licenses"),
        Category(name="Accessories", description="Various accessories"),
    ]
    for cat in default_categories:
        db.add(cat)
    
    print("Seeding borrowers...")
    default_borrowers = [
        Borrower(name="John Doe", division="Incident Response", phone="+62 811-123-456", email="john.doe@cybersec.com"),
        Borrower(name="Jane Smith", division="IT Support", phone="+62 822-987-654", email="jane.smith@cybersec.com"),
        Borrower(name="Alice Wonderland", division="Field Ops", phone="+62 833-111-222", email="alice@cybersec.com"),
        Borrower(name="Bob Builder", division="Engineering", phone="+62 844-333-444", email="bob@cybersec.com"),
        Borrower(name="Charlie Brown", division="Security Ops", phone="+62 855-555-666", email="charlie@cybersec.com"),
    ]
    for borrower in default_borrowers:
        db.add(borrower)
    
    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()