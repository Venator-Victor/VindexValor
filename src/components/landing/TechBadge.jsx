import React from 'react';
import { motion } from 'framer-motion';

const TechBadge = ({ name, icon: Icon, className = "bg-secondary/10 text-secondary-foreground border-secondary/20" }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.1 }}
      className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm ${className}`}
    >
      {Icon && <Icon size={18} className="opacity-80" />}
      <span className="font-semibold text-sm">{name}</span>
    </motion.div>
  );
};

export default TechBadge;