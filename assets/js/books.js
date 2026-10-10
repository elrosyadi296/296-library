/**
 * 296 Library — Books Management Frontend Controller
 */
class BooksController {
    static async fetchAll() {
        return await LibraryAPI.call("getPublicCatalog");
    }
}