const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/messages/en.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Add pageDescription to adminCategories
if (data.adminCategories && !data.adminCategories.pageDescription) {
  data.adminCategories.pageDescription =
    data.adminCategories.pageSubtitle || 'Organize your products into categories';
  delete data.adminCategories.pageSubtitle;
}

// Add pageDescription to adminPayouts
if (data.adminPayouts && !data.adminPayouts.pageDescription) {
  data.adminPayouts.pageDescription =
    data.adminPayouts.description || 'Manage seller payouts and schedule automated payments';
  data.adminPayouts.pageTitle = data.adminPayouts.title || 'Payouts';
  delete data.adminPayouts.title;
  delete data.adminPayouts.description;
}

// Add pageDescription to adminAdvertisementPlans
if (data.adminAdvertisementPlans && !data.adminAdvertisementPlans.pageDescription) {
  const subtitle = data.adminAdvertisementPlans.header?.subtitle;
  data.adminAdvertisementPlans.pageTitle =
    data.adminAdvertisementPlans.header?.title || 'Advertisement Plans';
  data.adminAdvertisementPlans.pageDescription =
    subtitle || 'Manage subscription plans for seller advertising';
}

// Add pageDescription to adminSubscriptions
if (data.adminSubscriptions && !data.adminSubscriptions.pageDescription) {
  data.adminSubscriptions.pageTitle = data.adminSubscriptions.heroTitle || 'Subscriptions';
  data.adminSubscriptions.pageDescription =
    data.adminSubscriptions.heroDescription ||
    'Manage seller feature plans and advertisement subscriptions';
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
console.log('✓ Updated en.json successfully');
console.log(
  '✓ Added pageDescription to: adminCategories, adminPayouts, adminAdvertisementPlans, adminSubscriptions'
);
