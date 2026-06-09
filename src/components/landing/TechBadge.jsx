import React from 'react';
import { motion } from 'framer-motion';

const TechBadge = ({ name, icon: Icon, iconClass, nfChar, className = "bg-muted text-foreground border-border" }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm cursor-default ${className}`}
    >
      {nfChar ? (
        <span style={{ fontSize: 20, lineHeight: 1 }}>{nfChar}</span>
      ) : iconClass ? (
        <i className={iconClass} style={{ fontSize: 20 }} />
      ) : Icon ? (
        <Icon size={18} />
      ) : null}
      <span className="font-semibold text-sm">{name}</span>
    </motion.div>
  );
};

export default TechBadge;