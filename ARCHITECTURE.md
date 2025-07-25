# Ripple Effect Architecture

The ripple effect feature has been refactored to improve its architecture, making it more modular, testable, and maintainable. The new architecture follows the principles of "Separated Presentation" and "Humble Object" as described by Martin Fowler.

## Separation of Concerns

The core logic of the ripple effect has been separated from the user interface. The `ForceBlast` class is now responsible for the core logic of the ripple effect, while the `handleForceBlast` function is a simple event handler that delegates the core logic to the `ForceBlast` class.

This separation of concerns makes the code more modular and easier to understand. It also makes it possible to test the core logic of the ripple effect in isolation, without having to rely on a browser environment.

## Humble Object

The `ForceBlast` class is a "Humble Object" that is responsible for the core logic of the ripple effect. It is a simple class that can be easily tested in isolation. The `handleForceBlast` function is a simple event handler that delegates the core logic to the `ForceBlast` class.

This use of the Humble Object pattern makes the code more testable and maintainable. It also makes it easier to understand the core logic of the ripple effect, as it is not cluttered with UI-related code.

## Benefits of the New Architecture

The new architecture of the ripple effect feature provides several benefits, including:

-   **Improved Modularity:** The core logic of the ripple effect is now encapsulated in a separate class, making the code more modular and easier to understand.
-   **Improved Testability:** The core logic of the ripple effect can now be tested in isolation, without having to rely on a browser environment.
-   **Improved Maintainability:** The separation of concerns and the use of the Humble Object pattern make the code easier to maintain and modify.
-   **Improved Readability:** The code is now easier to read and understand, as the core logic is not cluttered with UI-related code.
