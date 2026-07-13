from fastapi import APIRouter, HTTPException, Query 
import httpx

router = APIRouter(prefix="/modules", tags=["modules"])

NUSMODS_BASE = "https://api.nusmods.com/v2"
ACAD_YEAR = "2026-2027"

_module_list_cache: list | None = None

async def warmup_cache():
    global _module_list_cache
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{NUSMODS_BASE}/{ACAD_YEAR}/moduleList.json")
        resp.raise_for_status()
        _module_list_cache = resp.json()

@router.get("/search")
async def search_modules(query: str = Query(..., min_length=1)):
    global _module_list_cache
    if _module_list_cache is None:
        await warmup_cache()

    query_lower = query.lower()
    results = [
        m for m in _module_list_cache
        if query_lower in m["moduleCode"].lower()
        or query_lower in m["title"].lower()
    ]
    return results[:20]

@router.get("/{module_code}")
async def get_module(module_code: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{NUSMODS_BASE}/{ACAD_YEAR}/modules/{module_code.upper()}.json"
        )
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Module {module_code} not found")
        resp.raise_for_status()
        return resp.json()