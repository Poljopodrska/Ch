"""
Admin endpoints for system maintenance.
"""

import subprocess
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()


@router.post("/run-migrations")
async def run_migrations(x_admin_secret: str = Header(None)):
    """
    Manually run database migrations.
    Requires X-Admin-Secret header with value matching SECRET_KEY.

    **WARNING: This endpoint should be removed after initial migration**
    """
    from app.core.config import settings

    # Simple authentication
    if x_admin_secret != settings.SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    try:
        # Run alembic upgrade
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd="/app/backend",
            capture_output=True,
            text=True,
            timeout=60
        )

        return JSONResponse({
            "status": "success" if result.returncode == 0 else "failed",
            "return_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        })

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Migration timeout after 60 seconds")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration error: {str(e)}")


@router.get("/check-tables")
async def check_tables():
    """
    Check if pricing tables exist in the database.
    """
    from app.core.database import engine
    from sqlalchemy import text

    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                AND tablename IN ('industries', 'products', 'product_base_prices')
                ORDER BY tablename
            """))

            tables = [row[0] for row in result]

            return {
                "tables_found": tables,
                "all_present": len(tables) == 3,
                "missing": list(set(['industries', 'products', 'product_base_prices']) - set(tables))
            }
    except Exception as e:
        return {"error": str(e)}
