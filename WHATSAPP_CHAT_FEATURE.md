# WhatsApp Chat Feature Documentation

## Overview

The WhatsApp Chat feature provides a floating button that allows customers to easily start a conversation with your business via WhatsApp. This feature includes a beautiful UI/UX with smooth animations and multiple interaction options.

## Features

### 🎨 Beautiful UI/UX
- **Floating Action Button (FAB)**: Eye-catching green WhatsApp-branded button
- **Smooth Animations**: Powered by Framer Motion for delightful interactions
- **Pulse Animation**: Attention-grabbing pulse effect on the button
- **Notification Badge**: Shows a badge to indicate new message capability
- **Hover Tooltip**: Informative tooltip appears on hover

### 💬 Interactive Chat Interface
- **Expandable Chat Window**: Click the button to open a WhatsApp-styled chat interface
- **WhatsApp Branding**: Official WhatsApp colors and design patterns
- **Custom Message Input**: Users can type their own message before sending
- **Quick Messages**: Pre-defined quick message buttons for common inquiries
- **Business Information**: Displays your business name and response time

### 📱 Responsive Design
- **Mobile Optimized**: Works perfectly on all screen sizes
- **Configurable Visibility**: Option to show/hide on mobile devices
- **Positioning Options**: Can be placed on bottom-right or bottom-left

### ⚙️ Configurable
- **Environment Variables**: Easy configuration via `.env.local`
- **Custom Phone Number**: Set your WhatsApp business number
- **Custom Messages**: Configure default message and business name
- **Quick Message Templates**: Predefined messages for common inquiries

## Installation

The WhatsApp chat feature is already installed and configured! 🎉

## Configuration

### Environment Variables

Edit `apps/web/.env.local` to configure the WhatsApp chat:

```env
# WhatsApp Chat Configuration
# Format: Country code + phone number (without + or spaces)
# Example: 1234567890 for US, 919876543210 for India
NEXT_PUBLIC_WHATSAPP_NUMBER=1234567890
NEXT_PUBLIC_WHATSAPP_BUSINESS_NAME=Luxury Marketplace
NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE=Hello! I'm interested in your luxury products.
```

### Setting Your WhatsApp Number

1. Get your WhatsApp Business number
2. Format it as: `[Country Code][Phone Number]` (no + or spaces)
   - **US Example**: `12025551234` (for +1 202 555 1234)
   - **India Example**: `919876543210` (for +91 98765 43210)
   - **UK Example**: `447700900123` (for +44 7700 900123)
3. Update `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local`
4. Restart your dev server

## Usage

### Component Props

The WhatsApp component accepts the following props:

```typescript
interface WhatsAppChatProps {
  phoneNumber?: string;        // WhatsApp number (country code + number)
  defaultMessage?: string;     // Default message to send
  businessName?: string;       // Your business name
  position?: 'bottom-right' | 'bottom-left';  // Button position
  showOnMobile?: boolean;      // Show on mobile devices
}
```

### Default Configuration

In `apps/web/src/app/layout.tsx`:

```tsx
<WhatsAppChat
  phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '1234567890'}
  businessName={process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NAME || 'Luxury Marketplace'}
  defaultMessage={process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || "Hello! I'm interested in your luxury products."}
  position="bottom-right"
  showOnMobile={true}
/>
```

### Customization

You can customize the component by:

1. **Changing Position**:
   ```tsx
   <WhatsAppChat position="bottom-left" />
   ```

2. **Hiding on Mobile**:
   ```tsx
   <WhatsAppChat showOnMobile={false} />
   ```

3. **Custom Messages**:
   Edit the quick messages array in `whatsapp-chat.tsx`:
   ```typescript
   const quickMessages = [
     'Product inquiry',
     'Order status',
     'Customer support',
   ];
   ```

## UI Components

### Floating Button
- **Size**: 64px × 64px (w-16 h-16)
- **Colors**: WhatsApp official green gradient (#25D366 to #128C7E)
- **Icon**: Official WhatsApp logo
- **Badge**: Red notification badge (shows "1")
- **Animation**: Pulse effect and scale on hover

### Chat Window
- **Width**: 320px (mobile) / 384px (desktop)
- **Background**: WhatsApp-styled with pattern
- **Header**: Green gradient with business info
- **Body**: Message input with quick messages
- **Footer**: Quick action buttons

### Animations
- **Entry**: Scale and fade from bottom
- **Exit**: Scale and fade down
- **Hover**: Button scales up 10%
- **Tap**: Button scales down 10%
- **Pulse**: Continuous pulse effect on the button

## Features Breakdown

### 1. Floating Button
```
✓ Always visible (after 1 second delay)
✓ Sticks to bottom corner
✓ Pulse animation
✓ Notification badge
✓ Hover tooltip
✓ Smooth animations
```

### 2. Chat Interface
```
✓ Expandable popup
✓ WhatsApp branding
✓ Welcome message
✓ Message input field
✓ Send button
✓ Quick messages
✓ Close button
```

### 3. User Experience
```
✓ One-click to open chat
✓ Pre-filled message
✓ Quick message templates
✓ Edit before sending
✓ Direct WhatsApp link
✓ Mobile optimized
```

## Technical Details

### Dependencies
- **React**: Core framework
- **Framer Motion**: Animations
- **Tailwind CSS**: Styling
- **Next.js**: Environment variables

### File Structure
```
apps/web/
├── src/
│   ├── app/
│   │   └── layout.tsx              # WhatsApp integration
│   └── components/
│       └── whatsapp-chat.tsx       # Main component
└── .env.local                      # Configuration
```

### Component State
```typescript
const [isOpen, setIsOpen] = useState(false);      // Chat window state
const [isVisible, setIsVisible] = useState(false); // Button visibility
const [message, setMessage] = useState(defaultMessage); // Current message
```

## Best Practices

### 1. Phone Number Format
✅ **Correct**: `919876543210` (country code + number)
❌ **Wrong**: `+91 98765 43210` (with + and spaces)
❌ **Wrong**: `98765 43210` (missing country code)

### 2. Message Length
- Keep default message under 100 characters
- Be clear and professional
- Include relevant context

### 3. Quick Messages
- Provide 3-5 common inquiries
- Keep them short and clear
- Make them actionable

### 4. Business Hours
Consider adding business hours logic:
```typescript
const isBusinessHours = () => {
  const hour = new Date().getHours();
  return hour >= 9 && hour < 18; // 9 AM to 6 PM
};
```

## Testing

### Test Checklist
- [ ] Button appears after 1 second
- [ ] Button opens chat window
- [ ] Quick messages update the input
- [ ] Custom message can be typed
- [ ] Send button opens WhatsApp
- [ ] WhatsApp URL is correctly formatted
- [ ] Chat window closes properly
- [ ] Animations are smooth
- [ ] Works on mobile devices
- [ ] Environment variables are loaded

### Manual Testing
1. Visit http://localhost:3001
2. Wait for the WhatsApp button to appear
3. Click the button to open the chat
4. Try quick messages
5. Type a custom message
6. Click send to open WhatsApp
7. Verify the message is pre-filled

## Troubleshooting

### Button Not Appearing
- Check if 1 second has passed (intentional delay)
- Verify the component is imported in layout.tsx
- Check browser console for errors

### WhatsApp Not Opening
- Verify phone number format (no + or spaces)
- Check if WhatsApp is installed (on mobile)
- Try opening WhatsApp Web (on desktop)

### Message Not Pre-filled
- Check URL encoding in `handleWhatsAppClick`
- Verify `defaultMessage` is set correctly
- Test with different browsers

### Environment Variables Not Loading
- Restart the dev server after changing `.env.local`
- Verify variable names start with `NEXT_PUBLIC_`
- Check for syntax errors in `.env.local`

## Future Enhancements

### Possible Improvements
1. **Business Hours Detection**: Show different messages based on time
2. **Multi-language Support**: Detect user language
3. **Chat History**: Store recent conversations
4. **Analytics**: Track chat initiation rates
5. **A/B Testing**: Test different messages
6. **Typing Indicator**: Show "typing..." animation
7. **Agent Status**: Show online/offline status
8. **File Sharing**: Allow image/document sharing
9. **Keyboard Shortcuts**: Ctrl+Enter to send
10. **Sound Notifications**: Audio cue on open

## Support

For issues or questions:
- Check the troubleshooting section
- Review the configuration
- Test with a different browser
- Contact development team

## License

This feature is part of the Luxury E-commerce Platform.

---

**Last Updated**: December 1, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
