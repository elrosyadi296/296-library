/**
 * 296 Library — Public Catalog Frontend Controller
 */
class CatalogController {
    static async init() {
        const res = await LibraryAPI.call("getPublicCatalog");
        return res.status === "ok" ? res.data : [];
    }
}