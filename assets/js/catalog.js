/** 296 Library — Catalog controller */
class CatalogController { static async init() { const r = await LibraryAPI.call("getPublicCatalog"); return r.success ? r.data : []; } }
