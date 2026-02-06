import type { TutorialStep } from '../components/TutorialSystem.vue';

export const gameTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Bakery Manager!',
    content: 'Learn how to run your own bakery business. This tutorial will guide you through the basics of buying ingredients, baking products, and selling them to customers.',
    icon: '🏪',
    position: 'center',
  },
  {
    id: 'menu',
    title: 'The Main Menu',
    content: 'This is your command center. From here, you can start a new game day, check your dashboard, view statistics, or adjust settings.',
    icon: '🎮',
    target: '.bg-bakery-cream',
    position: 'center',
  },
  {
    id: 'start-game',
    title: 'Starting Your Day',
    content: 'Click the "Start New Game" button to begin a new business day. Each day consists of four phases: Buying, Baking, Selling, and Summary.',
    icon: '🎯',
    target: 'button:has-text("Start New Game")',
    position: 'bottom',
    action: 'Click "Start New Game" to continue',
  },
];

export const buyingPhaseTutorial: TutorialStep[] = [
  {
    id: 'buying-intro',
    title: 'Buying Phase',
    content: 'Welcome to the buying phase! Here you purchase ingredients for your recipes. Buy smart - ingredients cost money but are essential for baking.',
    icon: '🛒',
    position: 'center',
  },
  {
    id: 'buying-budget',
    title: 'Watch Your Budget',
    content: 'Your available cash is displayed at the top. Don\'t spend all your money on ingredients - you need to save some for operating costs!',
    icon: '💰',
    target: '.bg-white.rounded-lg.p-4.shadow-sm',
    position: 'bottom',
  },
  {
    id: 'buying-ingredients',
    title: 'Select Ingredients',
    content: 'Browse the available ingredients and adjust quantities using the + and - buttons. Each ingredient has a price and availability.',
    icon: '🥖',
    position: 'center',
    action: 'Try adding some flour and sugar',
  },
  {
    id: 'buying-proceed',
    title: 'Proceed to Baking',
    content: 'When you\'re satisfied with your purchases, click "Proceed to Baking" to move on to the next phase.',
    icon: '✅',
    position: 'center',
    action: 'Click "Proceed to Baking" when ready',
  },
];

export const bakingPhaseTutorial: TutorialStep[] = [
  {
    id: 'baking-intro',
    title: 'Baking Phase',
    content: 'Time to bake! Select recipes and choose how many of each product you want to make. Your available ingredients limit what you can bake.',
    icon: '👨‍🍳',
    position: 'center',
  },
  {
    id: 'baking-recipes',
    title: 'Choose Recipes',
    content: 'Each recipe shows required ingredients and difficulty level. Green checkmarks mean you have enough ingredients. Red X marks mean you need more.',
    icon: '📝',
    position: 'center',
  },
  {
    id: 'baking-quantity',
    title: 'Set Quantities',
    content: 'Use the quantity input to decide how many units to bake. The ingredients will be deducted automatically based on recipe requirements.',
    icon: '🔢',
    position: 'center',
    action: 'Set quantities for your chosen recipes',
  },
  {
    id: 'baking-quality',
    title: 'Quality Matters',
    content: 'Higher quality products sell for more, but they also require more skill and time. Start simple and work your way up!',
    icon: '⭐',
    position: 'center',
  },
];

export const sellingPhaseTutorial: TutorialStep[] = [
  {
    id: 'selling-intro',
    title: 'Selling Phase',
    content: 'Your bakery is open! Set prices for your products and serve customers. Find the sweet spot between profit and customer satisfaction.',
    icon: '💵',
    position: 'center',
  },
  {
    id: 'selling-pricing',
    title: 'Price Your Products',
    content: 'Set prices for each product. Higher prices mean more profit but might discourage customers. Lower prices attract buyers but reduce margins.',
    icon: '🏷️',
    position: 'center',
    action: 'Adjust prices to find the right balance',
  },
  {
    id: 'selling-customers',
    title: 'Serve Customers',
    content: 'Customers will appear throughout the day. Their preferences and price sensitivity vary. Happy customers become loyal regulars!',
    icon: '👥',
    position: 'center',
  },
  {
    id: 'selling-stock',
    title: 'Manage Inventory',
    content: 'Keep an eye on your stock levels. Running out too early means lost sales, but leftover items reduce profit.',
    icon: '📦',
    position: 'center',
  },
];

export const summaryPhaseTutorial: TutorialStep[] = [
  {
    id: 'summary-intro',
    title: 'Daily Summary',
    content: 'Great work! Here\'s how your business day went. Review your performance and learn from the results.',
    icon: '📊',
    position: 'center',
  },
  {
    id: 'summary-financial',
    title: 'Financial Results',
    content: 'Check your revenue, costs, and profit. Understanding these numbers is key to long-term success.',
    icon: '💰',
    position: 'center',
  },
  {
    id: 'summary-performance',
    title: 'Performance Metrics',
    content: 'See how many customers you served, which products were popular, and your customer satisfaction rating.',
    icon: '📈',
    position: 'center',
  },
  {
    id: 'summary-next',
    title: 'Plan Your Next Day',
    content: 'Use these insights to make better decisions tomorrow. Maybe buy more of popular ingredients, or adjust pricing strategies!',
    icon: '🎯',
    position: 'center',
    action: 'Click "Return to Menu" to finish',
  },
];

export const dashboardTutorial: TutorialStep[] = [
  {
    id: 'dashboard-intro',
    title: 'Business Dashboard',
    content: 'Your business intelligence hub! Track performance, analyze trends, and make data-driven decisions.',
    icon: '📊',
    position: 'center',
  },
  {
    id: 'dashboard-kpis',
    title: 'Key Performance Indicators',
    content: 'These cards show your most important metrics: cash on hand, daily revenue, net profit, and customer count.',
    icon: '📈',
    position: 'center',
  },
  {
    id: 'dashboard-charts',
    title: 'Visual Analytics',
    content: 'Charts help you spot trends over time. Use the tabs to explore different aspects of your business: market conditions, performance, and pricing.',
    icon: '📉',
    position: 'center',
  },
  {
    id: 'dashboard-insights',
    title: 'Make Better Decisions',
    content: 'Use this data to identify your best-selling products, optimize pricing, and plan inventory. Knowledge is profit!',
    icon: '💡',
    position: 'center',
  },
];
