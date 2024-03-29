# NC-Scorer

## Overview

NCScorer is a tool developed to standardize and automate the assessment of candidate variants in Exome Sequencing (ES) for patients with Chronic Kidney Disease of unknown etiology (CKDu). The tool leverages a scoring system called the Nephro Candidate Score (NCS) to prioritize candidate variants for further investigation, accelerating the discovery of new genetic associations in CKD.

This application is part of a broader research initiative that aims to apply the NCS to large CKD cohorts, such as the GCKD, to identify novel CKD-related genes and understand the genetic underpinnings of this complex disease.

## Installation

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

4. To run the application locally:
   ```sh
   npm run serve
   ```

5. To build the application for production:
   ```sh
   npm run build
   ```

## Usage

After starting the application, navigate to `http://localhost:8080` (or the configured port) in your web browser to begin using NCScorer. The interface allows users to search and score genetic variants based on predefined criteria.

## Contributing

Contributions to NCScorer are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for more information on how to report bugs, make feature requests, and submit pull requests.

## Code of Conduct

To ensure a welcoming and supportive environment for all contributors, please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

NCScorer is made available under the [MIT License](LICENSE). See the LICENSE file for more information.