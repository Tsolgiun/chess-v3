# Chess Master Frontend

This is the frontend for the Chess Master application, a web-based chess platform that allows users to play chess online, analyze games, and read chess-related blog posts.

## TypeScript Migration

This project has been migrated from JavaScript to TypeScript to improve type safety, developer experience, and code maintainability. The migration includes:

- Setting up TypeScript configuration
- Creating type definitions for the application
- Converting JavaScript files to TypeScript
- Adding type annotations to components, contexts, and utilities

## Project Structure

- `/src/components`: React components
- `/src/context`: Context providers for state management
- `/src/pages`: Page components
- `/src/services`: API services
- `/src/styles`: Global styles
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## TypeScript Configuration

The TypeScript configuration is defined in `tsconfig.json`. Key settings include:

- Target: ES5
- Module: ESNext
- Strict type checking enabled
- JSX mode: react-jsx

## Type Definitions

The application uses several types of definitions:

- **Enums**: For constants like player colors, game status, etc.
- **Interfaces**: For data structures like User, Game, etc.
- **Context Types**: For type-safe context providers
- **Component Props**: For type-safe component props

## Styled Components

The application uses styled-components for styling. TypeScript integration with styled-components includes:

- Theme typing
- Component prop typing
- Style prop typing

## Future Improvements

- Add more comprehensive type coverage
- Implement unit tests with TypeScript
- Add more TypeScript-specific features like discriminated unions for state management
