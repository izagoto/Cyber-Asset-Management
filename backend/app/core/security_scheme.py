from fastapi.security import HTTPBearer

# Ini yang bikin tombol Authorize muncul di Swagger
bearer_scheme = HTTPBearer()