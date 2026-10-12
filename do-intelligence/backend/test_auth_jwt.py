import os, sys

sys_path = r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend'
if sys_path not in sys.path:
    sys.path.insert(0, sys_path)

from app.core.db import SessionLocal
from app.core.config import engine, Base
from app.models.User import User, Role, Permission
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.api.auth import UserRegisterRequest, register_user, UserLoginRequest, login

def test_jwt_auth():
    print("Testing JWT Authentication & Password Hashing Core...")

    # 1. Password Hashing Test
    raw_password = "SecretPassword123!"
    hashed = hash_password(raw_password)
    assert verify_password(raw_password, hashed), "Password verification failed!"
    print("✓ Password hashing & verification working")

    # 2. Token Generation & Decoding Test
    token_data = {"sub": "1", "email": "underwriter@dointelligence.com", "roles": ["underwriter"]}
    token = create_access_token(token_data)
    decoded = decode_token(token)
    assert decoded is not None and decoded.get("email") == "underwriter@dointelligence.com", "Token decoding failed!"
    print("✓ JWT Token generation & decoding working")

    # 3. Database User & Roles Seed Test
    db = SessionLocal()
    try:
        # Create base roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Administrador do sistema")
            db.add(admin_role)

        underwriter_role = db.query(Role).filter(Role.name == "underwriter").first()
        if not underwriter_role:
            underwriter_role = Role(name="underwriter", description="Subscritor D&O Sênior")
            db.add(underwriter_role)

        db.commit()

        # Create admin user if not exists
        admin_user = db.query(User).filter(User.email == "admin@dointelligence.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@dointelligence.com",
                password_hash=hash_password("AdminDO2025!"),
                full_name="Carlos Mendes (Admin)",
                is_active=True,
                is_superuser=True,
                roles=[admin_role, underwriter_role]
            )
            db.add(admin_user)
            db.commit()
            print("✓ Seed Admin user created successfully")
        else:
            print("✓ Seed Admin user already exists in DB")

        print(f"  Admin User Email: {admin_user.email}")
        print(f"  Roles: {[r.name for r in admin_user.roles]}")

    finally:
        db.close()

    print("\n✅ All JWT Auth & RBAC core tests passed successfully!")

if __name__ == "__main__":
    test_jwt_auth()
