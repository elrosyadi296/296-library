/**
 * 296 Library — Circulation (Borrow/Return) Frontend Controller
 */
class CirculationController {
    static async borrowBook(memberId, copyId, petugasId) {
        return await LibraryAPI.call("borrowBook", { memberId, copyId, petugasId });
    }
}