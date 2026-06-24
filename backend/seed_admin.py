from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import hash_password

def seed_database():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    print("Seeding users...")
    hashed_pass = hash_password("Jbond123!")

    admin = User(
        email="cybersecurity@local.com",
        fullname="James Bond",
        password_hash=hashed_pass,
        role="Admin",
        division="Cyber Security Researcher",
        phone="+62 811-2222-3333"
    )

    db.add(admin)
    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()