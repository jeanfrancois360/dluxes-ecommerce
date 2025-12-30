export interface ProductTypeFieldsProps {
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

// Property Types
export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

// Real Estate Amenities
export const REAL_ESTATE_AMENITIES = [
  'Swimming Pool',
  'Garage',
  'Garden',
  'Gym',
  'Security System',
  'Balcony',
  'Fireplace',
  'Central AC',
  'Central Heating',
  'Hardwood Floors',
  'Laundry Room',
  'Walk-in Closet',
  'Home Office',
  'Smart Home',
  'Solar Panels',
  'EV Charging',
  'Wine Cellar',
  'Guest House',
  'Gated Community',
  'Waterfront',
];

// For future product types
export const VEHICLE_TRANSMISSIONS = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'cvt', label: 'CVT' },
];

export const VEHICLE_FUEL_TYPES = [
  { value: 'petrol', label: 'Petrol/Gasoline' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'plugin_hybrid', label: 'Plug-in Hybrid' },
];

export const VEHICLE_BODY_TYPES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'van', label: 'Van' },
  { value: 'wagon', label: 'Wagon' },
  { value: 'convertible', label: 'Convertible' },
];

export const VEHICLE_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'certified_preowned', label: 'Certified Pre-Owned' },
];

export const LICENSE_TYPES = [
  { value: 'personal', label: 'Personal Use' },
  { value: 'commercial', label: 'Commercial Use' },
  { value: 'extended', label: 'Extended License' },
  { value: 'unlimited', label: 'Unlimited' },
];

// Vehicle Features
export const VEHICLE_FEATURES = [
  'Leather Seats',
  'Sunroof/Moonroof',
  'Navigation System',
  'Backup Camera',
  'Bluetooth',
  'Apple CarPlay',
  'Android Auto',
  'Heated Seats',
  'Cooled Seats',
  'Keyless Entry',
  'Push Button Start',
  'Remote Start',
  'Blind Spot Monitor',
  'Lane Departure Warning',
  'Adaptive Cruise Control',
  'Parking Sensors',
  'Premium Audio',
  'Third Row Seating',
  'Tow Package',
  'All-Wheel Drive',
  'Turbocharged',
  'Heads-Up Display',
];

// Digital Product Constants
export const DIGITAL_LICENSE_TYPES = [
  { value: 'personal', label: 'Personal Use' },
  { value: 'commercial', label: 'Commercial Use' },
  { value: 'extended', label: 'Extended License' },
  { value: 'unlimited', label: 'Unlimited' },
];

export const DIGITAL_FILE_FORMATS = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'zip', label: 'ZIP Archive' },
  { value: 'mp3', label: 'MP3 Audio' },
  { value: 'mp4', label: 'MP4 Video' },
  { value: 'mov', label: 'MOV Video' },
  { value: 'png', label: 'PNG Image' },
  { value: 'jpg', label: 'JPG Image' },
  { value: 'psd', label: 'Photoshop (PSD)' },
  { value: 'ai', label: 'Illustrator (AI)' },
  { value: 'svg', label: 'SVG Vector' },
  { value: 'epub', label: 'EPUB E-book' },
  { value: 'exe', label: 'Windows Executable' },
  { value: 'dmg', label: 'Mac Installer' },
  { value: 'apk', label: 'Android Package' },
  { value: 'other', label: 'Other' },
];

export const DIGITAL_UPDATE_POLICIES = [
  { value: 'free_lifetime', label: 'Free Lifetime Updates' },
  { value: 'free_1year', label: 'Free Updates for 1 Year' },
  { value: 'paid_updates', label: 'Paid Updates Only' },
  { value: 'no_updates', label: 'No Updates Included' },
];

// Service Product Constants
export const SERVICE_TYPES = [
  { value: 'in_person', label: 'In-Person' },
  { value: 'online', label: 'Online/Remote' },
  { value: 'hybrid', label: 'Hybrid (Both)' },
];

export const SERVICE_DURATION_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'sessions', label: 'Sessions' },
];

export const SERVICE_BOOKING_LEAD_TIMES = [
  { value: 0, label: 'No advance booking required' },
  { value: 1, label: '1 hour in advance' },
  { value: 2, label: '2 hours in advance' },
  { value: 4, label: '4 hours in advance' },
  { value: 24, label: '1 day in advance' },
  { value: 48, label: '2 days in advance' },
  { value: 72, label: '3 days in advance' },
  { value: 168, label: '1 week in advance' },
];

export const COMMON_CREDENTIALS = [
  'Licensed Professional',
  'Certified Expert',
  'Insured',
  'Background Checked',
  'Years of Experience',
  'Degree/Diploma',
  'Industry Certification',
  'Professional Membership',
];

// Rental Product Constants
export const RENTAL_PERIOD_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const RENTAL_AGE_REQUIREMENTS = [
  { value: 16, label: '16 years old' },
  { value: 18, label: '18 years old' },
  { value: 21, label: '21 years old' },
  { value: 25, label: '25 years old' },
];

export const COMMON_RENTAL_INCLUDES = [
  'Basic Insurance',
  'Unlimited Mileage',
  'Free Cancellation',
  'Roadside Assistance',
  'Cleaning Service',
  'Maintenance',
  'Accessories',
  'User Manual',
  'Customer Support',
  'Setup/Installation',
];

export const COMMON_RENTAL_EXCLUDES = [
  'Fuel/Power',
  'Additional Insurance',
  'Late Return Fees',
  'Damage Repair',
  'Delivery Fee',
  'Extra Accessories',
  'Cleaning Fee',
  'Tolls/Tickets',
];
