# Installation

To set up the NCScorer for development or deployment, follow these steps:

1. Ensure that you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your machine.

2. Clone the repository:

    ```sh
    git clone https://github.com/halbritter-lab/nc-scorer.git
    cd nc-scorer
    ```

3. Install the dependencies:

    ```sh
    npm install
    ```

4. To run the application locally for development:

    ```sh
    npm run dev
    ```

    To expose the application on your network (for accessing from other devices):

    ```sh
    npm run dev -- --host
    ```

5. To build the application for production:

    ```sh
    npm run build
    ```

6. To preview the production build locally:

    ```sh
    npm run preview
    ```
