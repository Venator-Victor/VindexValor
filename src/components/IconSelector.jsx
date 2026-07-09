import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import BxIcon from '@/components/BxIcon';
import { ICON_SEARCH_KEYWORDS_PT } from '@/utils/iconSearchKeywords';
import { normalizeText as normalize } from '@/utils/text';

const IconSelector = ({ selectedIcon, onSelect }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const icons = [
    'bx-target-lock', 'bx-money', 'bx-trophy', 'bx-home', 'bx-car',
    'bx-plane', 'bx-plane-alt', 'bx-book', 'bx-book-open', 'bx-graduation',
    'bx-briefcase', 'bx-gift', 'bx-heart', 'bx-star', 'bx-diamond',
    'bx-mobile', 'bx-laptop', 'bx-camera', 'bx-music', 'bx-video',
    'bx-joystick', 'bx-dumbbell', 'bx-plus-medical', 'bx-building',
    'bx-building-house', 'bx-store', 'bx-cart', 'bx-shopping-bag',
    'bx-wallet', 'bx-credit-card', 'bx-dollar', 'bx-euro', 'bx-bitcoin',
    'bx-pie-chart', 'bx-bar-chart', 'bx-trending-up', 'bx-cloud',
    'bx-sun', 'bx-moon', 'bx-water', 'bx-bulb', 'bx-restaurant',
    'bx-coffee', 'bx-bed', 'bx-shield', 'bx-wifi', 'bx-plug',
    'bx-gas-pump', 'bx-closet', 'bx-face', 'bx-child', 'bx-paw',
    'bx-bus', 'bx-group',
    // Finance & category icons
    'bx-bank', 'bx-landmark', 'bx-piggy-bank', 'bx-safe', 'bx-calculator',
    'bx-coins', 'bx-chart-line', 'bx-umbrella', 'bx-pill', 'bx-syringe',
    'bx-taxi', 'bx-train', 'bx-subway', 'bx-truck', 'bx-motorcycle',
    'bx-ship', 'bx-spa', 'bx-popcorn', 'bx-ticket', 'bx-beer',
    'bx-wine', 'bx-pizza', 'bx-tv', 'bx-dog', 'bx-cat', 'bx-tree',
    // Currency & crypto
    'bx-pound', 'bx-yen', 'bx-ruble', 'bx-rupee', 'bx-won', 'bx-lira',
    'bx-currency-note', 'bx-crypto', 'bx-wallet-alt', 'bx-coin',
    // Electronics
    'bx-headphone', 'bx-speaker', 'bx-printer', 'bx-keyboard', 'bx-mouse',
    'bx-usb', 'bx-server', 'bx-radio', 'bx-hard-drive', 'bx-chip',
    'bx-devices', 'bx-watch', 'bx-microphone', 'bx-battery', 'bx-cctv',
    // Furniture & home appliances
    'bx-chair', 'bx-couch', 'bx-table', 'bx-cabinet', 'bx-fridge',
    'bx-washer', 'bx-dishwasher', 'bx-microwave', 'bx-oven',
    'bx-air-conditioner', 'bx-fan', 'bx-door', 'bx-window', 'bx-garage',
    'bx-shower',
    // Inheritance, legal & estate
    'bx-scroll', 'bx-gavel', 'bx-key', 'bx-signature', 'bx-stamp',
    'bx-buildings', 'bx-medal-star', 'bx-handshake', 'bx-jewelry',
    // Travel, sports & hobbies
    'bx-luggage', 'bx-compass', 'bx-globe', 'bx-backpack', 'bx-basketball',
    'bx-football', 'bx-golf', 'bx-guitar', 'bx-palette', 'bx-table-tennis',
    'bx-rugby', 'bx-skateboard',
    // Health & misc
    'bx-tooth', 'bx-thermometer', 'bx-dna', 'bx-ambulance', 'bx-recycle',
    'bx-broom', 'bx-fire', 'bx-rocket', 'bx-robot', 'bx-school',
    'bx-graduation-cap', 'bx-anchor', 'bx-snowflake', 'bx-pool', 'bx-route',
    'bx-cake', 'bx-balloon', 'bx-basket', 'bx-leaf',
  ];

  const normalizedSearch = normalize(searchTerm);
  const filteredIcons = icons.filter((icon) => {
    if (!normalizedSearch) return true;
    if (normalize(icon).includes(normalizedSearch)) return true;
    return (ICON_SEARCH_KEYWORDS_PT[icon] || []).some((keyword) =>
      normalize(keyword).includes(normalizedSearch)
    );
  });

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder={t('common.search_icon_placeholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text text-sm outline-none hover:border-primary focus:border-primary"
      />

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-vindex-border rounded-lg bg-gray-50 dark:bg-vindex-bg/50">
        {filteredIcons.length > 0 ? filteredIcons.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onSelect(icon)}
            className={`
              aspect-square flex items-center justify-center rounded-lg transition-all
              ${selectedIcon === icon
                ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-vindex-border/50'}
            `}
            title={icon.replace('bx-', '')}
          >
            <BxIcon iconClass={icon} size={20} />
          </button>
        )) : (
          <div className="col-span-full text-center text-sm text-gray-500 py-4">
            {t('common.no_icon_found')}
          </div>
        )}
      </div>

      {selectedIcon && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{t('common.selected_label')}</span>
          <BxIcon iconClass={selectedIcon} size={18} className="text-primary" />
          <span className="font-mono">{selectedIcon}</span>
        </div>
      )}
    </div>
  );
};

export default IconSelector;
