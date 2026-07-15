import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Tabbed screenshot gallery for the landing page — one browser-chrome frame,
// tabs swap which page's screenshot is shown inside it.
const ProductShowcase = ({ tabs }) => {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              active === i
                ? 'bg-primary text-black border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/40">
          <span className="w-3 h-3 rounded-full bg-red-400"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
          <span className="w-3 h-3 rounded-full bg-green-400"></span>
        </div>
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={tabs[active].key}
              src={tabs[active].src}
              alt={tabs[active].label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full h-auto block"
            />
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductShowcase;
