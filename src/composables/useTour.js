// src/composables/useTour.js
import { ref, onMounted, onUnmounted } from 'vue';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

// Helper function to check if it's the user's first visit
const isFirstVisit = () => {
  return localStorage.getItem('nc-scorer-tour-shown') !== 'true';
};

// Helper function to mark the tour as shown
const markTourAsShown = () => {
  localStorage.setItem('nc-scorer-tour-shown', 'true');
};

export default function useTour() {
  const tour = ref(null);
  const isTourActive = ref(false);
  // Helper function to check if an element exists in the DOM
  const elementExists = (selector) => {
    return document.querySelector(selector) !== null;
  };

  // Initialize Shepherd tour
  const initTour = () => {
    // Create new tour instance if it doesn't exist
    if (!tour.value) {
      tour.value = new Shepherd.Tour({
        defaultStepOptions: {
          cancelIcon: {
            enabled: true,
          },
          classes: 'shepherd-theme-custom',
          scrollTo: true,
          arrow: true,
        },
        useModalOverlay: true,
      });

      // Define the tour steps
      defineTourSteps();
    }
  };

  // Define all steps for the tour
  const defineTourSteps = () => {
    // -- Common steps for all pages --
    // Welcome step
    tour.value.addStep({
      id: 'welcome',
      text: '<h3>Welcome to NC-Scorer!</h3><p>This quick tour will guide you through the main features of the application to help you get started.</p>',
      attachTo: {
        element: 'body',
        on: 'center',
      },
      buttons: [
        {
          text: 'Skip Tour',
          action: tour.value.cancel,
        },
        {
          text: 'Next',
          action: tour.value.next,
        },
      ],
    });

    // App Logo step
    tour.value.addStep({
      id: 'app-logo',
      text: "<h3>NC-Scorer Logo</h3><p>Click on the logo to navigate to the home page from anywhere in the application.</p><p>There's also a hidden easter egg message when you hover over it!</p>",
      attachTo: {
        element: '.app-logo',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Back',
          action: tour.value.back,
        },
        {
          text: 'Next',
          action: tour.value.next,
        },
      ],
    });

    // App Menu Items step
    tour.value.addStep({
      id: 'menu-items',
      text: '<h3>Navigation Menu</h3><p>These menu items help you navigate through different sections of the application:</p><ul><li>Search - Find and score variants</li><li>FAQ - Frequently asked questions</li><li>About - Information about NC-Scorer</li></ul>',
      attachTo: {
        element: '.menu-items',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Back',
          action: tour.value.back,
        },
        {
          text: 'Next',
          action: tour.value.next,
        },
      ],
    });

    // Cache Toggle Button step
    tour.value.addStep({
      id: 'cache-toggle',
      text: '<h3>API Cache Toggle</h3><p>Toggle API caching on/off with this button.</p><p>When enabled, repeated API calls use cached data for faster performance. When disabled, fresh data is fetched from the API each time.</p>',
      attachTo: {
        element: '.v-btn .mdi-database-check, .v-btn .mdi-database-off',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Back',
          action: tour.value.back,
        },
        {
          text: 'Next',
          action: tour.value.next,
        },
      ],
    });

    // Theme toggle step
    tour.value.addStep({
      id: 'theme-toggle',
      text: '<h3>Theme Toggle</h3><p>You can switch between light and dark themes by clicking this button.</p>',
      attachTo: {
        element: '.theme-toggle',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Back',
          action: tour.value.back,
        },
        {
          text: 'Next',
          action: tour.value.next,
        },
      ],
    });

    // Main search tabs step - only show if tabs exist
    if (elementExists('.v-tabs')) {
      tour.value.addStep({
        id: 'search-tabs',
        text: '<h3>Search Options</h3><p>NC-Scorer provides several ways to search:</p><ul><li><strong>Scoring Search</strong>: Find and score genetic variants</li><li><strong>Variant Search</strong>: Look up specific variants</li><li><strong>Gene Search</strong>: Explore genes of interest</li></ul>',
        attachTo: {
          element: '.v-tabs',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // -- Search page input steps - only show if elements exist --
    // Variant input step
    if (elementExists('.variant-input')) {
      tour.value.addStep({
        id: 'variant-input',
        text: '<h3>Enter a Variant</h3><p>Type a variant in either VCF or HGVS format here.</p><p>Example: <code>NM_033380.3:c.1871G>A</code></p>',
        attachTo: {
          element: '.variant-input',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // Inheritance pattern step
    if (elementExists('.inheritance-select')) {
      tour.value.addStep({
        id: 'inheritance-pattern',
        text: '<h3>Inheritance Pattern</h3><p>Select the inheritance pattern for your variant (e.g., Denovo, Dominant, Recessive).</p><p>This affects how the variant is scored.</p>',
        attachTo: {
          element: '.inheritance-select',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // Segregation probability step
    if (elementExists('.segregation-input')) {
      tour.value.addStep({
        id: 'segregation-probability',
        text: '<h3>Segregation Probability</h3><p>For family studies, enter the segregation probability value (0-1).</p><p>This field is not always required, depending on the inheritance pattern selected.</p>',
        attachTo: {
          element: '.segregation-input',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // Search button step
    if (elementExists('.search-button')) {
      tour.value.addStep({
        id: 'search-button',
        text: "<h3>Start Your Search</h3><p>Once you've entered your variant details, click the Search button to analyze and score the variant.</p>",
        attachTo: {
          element: '.search-button',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // -- Scoring results steps - only show if elements exist --
    // Combined score card step
    if (elementExists('.combined-score-card')) {
      tour.value.addStep({
        id: 'combined-score',
        text: '<h3>Nephro Candidate Score (NSC)</h3><p>This is the final combined score for your variant. It ranges from 0-10, with higher scores indicating variants of greater interest.</p><p>The score is calculated based on gene relevance, variant impact, and inheritance pattern.</p>',
        attachTo: {
          element: '.combined-score-card',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // Gene card step
    if (elementExists('.gene-card')) {
      tour.value.addStep({
        id: 'gene-card',
        text: '<h3>Gene Details</h3><p>This card shows information about the gene containing your variant.</p><p>The <strong>Nephro Candidate Gene Score</strong> is a key component of the final NSC score.</p>',
        attachTo: {
          element: '.gene-card',
          on: 'left',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // Variant card step
    if (elementExists('.variant-card')) {
      tour.value.addStep({
        id: 'variant-card',
        text: '<h3>Variant Details</h3><p>This card displays annotations and frequency data for your variant.</p><p>The <strong>Nephro Variant Score</strong> is another key component of the final NSC score.</p>',
        attachTo: {
          element: '.variant-card',
          on: 'right',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // Inheritance card step
    if (elementExists('.inheritance-card')) {
      tour.value.addStep({
        id: 'inheritance-card',
        text: '<h3>Inheritance Parameters</h3><p>This card shows your selected inheritance pattern and segregation probability.</p><p>The <strong>Inheritance Score</strong> is the third key component of the final NSC score.</p>',
        attachTo: {
          element: '.inheritance-card',
          on: 'left',
        },
        buttons: [
          {
            text: 'Back',
            action: tour.value.back,
          },
          {
            text: 'Next',
            action: tour.value.next,
          },
        ],
      });
    }

    // -- FooterBar elements --

    // Footer links step - using more reliable selectors for the footer
    tour.value.addStep({
      id: 'footer-links',
      text: '<h3>Additional Resources</h3><p>Find more information in these links:</p><ul><li>GitHub repository for the source code</li><li>Documentation for detailed usage guides</li><li>License information</li></ul>',
      attachTo: {
        element: 'v-footer',
        on: 'top',
      },
      buttons: [
        {
          text: 'Back',
          action: tour.value.back,
        },
        {
          text: 'Finish Tour',
          action: tour.value.complete,
        },
      ],
    });
  };

  // Start the tour
  const startTour = () => {
    if (tour.value) {
      // Re-initialize the tour to ensure steps match current page
      tour.value.steps = [];
      defineTourSteps();
      isTourActive.value = true;
      tour.value.start();
    }
  };

  // Cancel the tour
  const cancelTour = () => {
    if (tour.value) {
      tour.value.cancel();
      isTourActive.value = false;
    }
  };

  // Complete the tour
  const completeTour = () => {
    if (tour.value) {
      tour.value.complete();
      isTourActive.value = false;
      markTourAsShown();
    }
  };

  // Check local storage and initialize on component mount
  onMounted(() => {
    initTour();

    // Set up event listeners
    if (tour.value) {
      tour.value.on('cancel', () => {
        isTourActive.value = false;
      });

      tour.value.on('complete', () => {
        isTourActive.value = false;
        markTourAsShown();
      });
    }
  });

  // Clean up on component unmount
  onUnmounted(() => {
    if (tour.value) {
      tour.value.cancel();
      tour.value = null;
    }
  });

  return {
    tour,
    isTourActive,
    startTour,
    cancelTour,
    completeTour,
    isFirstVisit,
  };
}
