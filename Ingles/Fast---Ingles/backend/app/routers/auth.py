from fastapi import APIRouter, Depends, HTTPException, status, Header
from supabase import Client

from app.supabase_client import get_supabase
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.utils.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, supabase: Client = Depends(get_supabase)):
    """Register a new user using Supabase REST API."""
    try:
        # Check if user exists
        response = supabase.table("users").select("*").eq("email", user_data.email).execute()
        if response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya está registrado"
            )
        
        # Create user in database
        user_record = {
            "name": user_data.name,
            "email": user_data.email,
            "password": get_password_hash(user_data.password),
            "role": "user",
            "status": "active"
        }
        
        insert_response = supabase.table("users").insert(user_record).execute()
        
        if not insert_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario"
            )
        
        user = insert_response.data[0]
        
        return UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            photo_url=user.get("photo_url"),
            role=user["role"],
            status=user["status"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, supabase: Client = Depends(get_supabase)):
    """Login and get access token."""
    try:
        # Get user from database
        response = supabase.table("users").select("*").eq("email", credentials.email).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credenciales inválidas"
            )
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(credentials.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credenciales inválidas"
            )
        
        # Check status
        if user["status"] == "inactive":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario desactivado"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_me(
    authorization: str = Header(None, alias="Authorization"),
    supabase: Client = Depends(get_supabase)
):
    """Get current user information."""
    from jose import jwt, JWTError
    from app.config import get_settings
    
    settings = get_settings()
    
    # Get token from Authorization header
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    token = authorization.split(" ")[1]
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")  # UUID string
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    # Fetch user from Supabase
    try:
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        user = response.data[0]
        
        return UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            photo_url=user.get("photo_url"),
            role=user["role"],
            status=user["status"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )
