# TRON TRC-20 Token Management Tool - Design Guidelines

## Design Approach

**Selected Framework:** Material Design with Blockchain/Crypto UI Patterns
- Drawing inspiration from developer tools like Remix IDE, blockchain explorers like Etherscan, and wallet interfaces like MetaMask
- Focus on data clarity, transaction confidence, and efficient workflows
- Prioritize information density with clear visual hierarchy

## Core Design Elements

### A. Color Palette

**Dark Mode Primary (Base Interface):**
- Background: 220 15% 8% (deep slate)
- Surface: 220 15% 12% (elevated cards)
- Surface Elevated: 220 15% 16% (dropdowns, modals)

**Brand & Accent Colors:**
- Primary (TRON Red): 0 85% 55% (for CTAs, active states)
- Success: 142 71% 45% (successful transactions, confirmations)
- Warning: 38 92% 50% (pending states, cautions)
- Error: 0 72% 51% (failed transactions, errors)
- Info: 217 91% 60% (network indicators, tooltips)

**Text Hierarchy:**
- Primary Text: 0 0% 95%
- Secondary Text: 220 10% 65%
- Tertiary Text: 220 8% 45%
- Disabled: 220 5% 35%

**Network Indicators:**
- Mainnet Badge: 0 85% 55% with 0 85% 55% / 0.15 background
- Testnet Badge: 38 92% 50% with 38 92% 50% / 0.15 background

### B. Typography

**Font System:**
- Primary: 'Inter' (Google Fonts) - for UI text, forms, labels
- Monospace: 'JetBrains Mono' (Google Fonts) - for addresses, hashes, code

**Scale:**
- Headings: text-2xl to text-3xl, font-semibold
- Section Headers: text-lg, font-medium
- Body: text-sm to text-base, font-normal
- Captions/Labels: text-xs, font-medium, uppercase tracking-wide
- Addresses/Hashes: text-sm, font-mono

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 3, 4, 6, 8, 12
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Page margins: px-6 to px-8

**Grid Structure:**
- Dashboard: Two-column layout on desktop (sidebar + main content)
- Sidebar: w-64 fixed, network switcher + navigation
- Main Content: flex-1, max-w-6xl centered
- Forms: Single column, max-w-2xl for optimal readability
- Transaction Lists: Full-width tables with responsive cards on mobile

### D. Component Library

**Navigation & Controls:**
- Sidebar Navigation: Vertical list with icon + label, active state with primary color accent
- Network Switcher: Prominent toggle at top with current network badge, click to reveal dropdown
- Tab Navigation: Underline style for token operations (Deploy, Transfer, Mint, Burn)

**Forms & Inputs:**
- Input Fields: Dark background (220 15% 10%), border (220 20% 25%), focus ring in primary color
- Text Inputs: h-12, rounded-lg, px-4
- Select Dropdowns: Consistent height, chevron icon, hover state
- Address Inputs: Monospace font, truncate with copy button
- Amount Inputs: Right-aligned for numbers, denomination label

**Data Display:**
- Token Cards: Elevated surface, rounded-xl, p-6, shadow-lg
- Transaction Cards: Compact rows with status icons, timestamps, amounts
- Info Panels: Bordered containers with label + value pairs
- Status Badges: Rounded-full, px-3 py-1, with status-specific colors
- Copy Buttons: Icon-only, appears on hover for addresses/hashes

**Action Components:**
- Primary Buttons: bg-primary, h-11, px-6, rounded-lg, font-medium
- Secondary Buttons: outline with border-2, same dimensions
- Danger Actions: bg-error for destructive operations (burn)
- Icon Buttons: w-10 h-10, rounded-lg, for copy/refresh actions

**Feedback & Overlays:**
- Transaction Pending: Spinner with status message
- Success Confirmation: Green checkmark icon + success message, auto-dismiss
- Error Alerts: Red alert banner with error details, persistent
- Loading States: Skeleton loaders for data-heavy sections
- Tooltips: Dark tooltip on hover for technical terms

### E. Key Interaction Patterns

**Transaction Flow:**
1. Form entry with real-time validation
2. Review modal with gas estimation and total cost
3. Confirmation step with wallet signature prompt
4. Pending state with transaction hash
5. Success/failure feedback with explorer link

**Network Switching:**
- Clear visual indicator of current network (always visible)
- One-click toggle with confirmation modal for mainnet operations
- Persist network preference across sessions

**Address Handling:**
- Always truncate: 0x1234...5678 format
- Copy button on hover
- Validation feedback (checkmark for valid, error for invalid)

**Data Refresh:**
- Manual refresh buttons for balances and transaction history
- Auto-refresh on transaction confirmation
- Loading indicators during fetch

## Layout Specifications

**Dashboard Structure:**
- Fixed sidebar (left): 256px width, network switcher + nav links
- Main content area: Scrollable, max-w-6xl, mx-auto, px-6 py-8
- Top bar: Account address + balance display (sticky)

**Token Deploy Section:**
- Two-column form for token parameters (name/symbol, decimals/supply)
- Preview card showing final configuration
- Large deploy button at bottom

**Token Management:**
- Token list as grid (2-3 columns on desktop)
- Each card shows: name, symbol, address (truncated), balance, quick actions
- Click card to expand full management panel

**Transaction History:**
- Table view on desktop: Status | Type | Amount | Hash | Time
- Card view on mobile: Stacked information with status icon
- Pagination or infinite scroll for long lists

## Special Considerations

**Security Visual Cues:**
- Mainnet operations: Red warning banner before confirmation
- Private key fields: Password input with visibility toggle, warning icon
- Irreversible actions (burn): Require typed confirmation

**Empty States:**
- No tokens deployed: Hero illustration + "Deploy Your First Token" CTA
- No transactions: Clean state with action prompt
- Network connection lost: Retry button with status message

**Responsive Behavior:**
- Mobile: Collapse sidebar to hamburger menu
- Tablet: Reduce grid columns, maintain functionality
- Desktop: Full multi-column layouts with optimal spacing