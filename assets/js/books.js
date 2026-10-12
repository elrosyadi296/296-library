/** 296 Library — Books controller */
class BooksController { static fetchAll() { return LibraryAPI.call("getPublicCatalog"); } }
