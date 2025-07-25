# Changelog

## [1.1.0] - 2024-07-24

### Changed

-   **Refactored Ripple Effect Architecture:** The architecture of the ripple effect feature has been refactored to improve its modularity, testability, and maintainability. The core logic of the ripple effect has been encapsulated in a new `ForceBlast` class, which is a "Humble Object" that can be easily tested in isolation. The `handleForceBlast` function has been refactored to be a simple event handler that delegates the core logic to the `ForceBlast` class.

### Why This Change is Helpful

The new architecture of the ripple effect feature provides several benefits, including:

-   **Improved Modularity:** The core logic of the ripple effect is now encapsulated in a separate class, making the code more modular and easier to understand.
-   **Improved Testability:** The core logic of the ripple effect can now be tested in isolation, without having to rely on a browser environment.
-   **Improved Maintainability:** The separation of concerns and the use of the Humble Object pattern make the code easier to maintain and modify.
-   **Improved Readability:** The code is now easier to read and understand, as the core logic is not cluttered with UI-related code.
