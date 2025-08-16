"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";

interface TimelineStep {
  title: string;
  description: string;
  icon?: React.ReactNode;
  isCompleted?: boolean;
  isActive?: boolean;
}

interface TimelineProps {
  steps: TimelineStep[];
  variant?: "vertical" | "horizontal";
  showProgress?: boolean;
  className?: string;
}

const Timeline = ({ 
  steps, 
  variant = "vertical", 
  showProgress = true,
  className = "" 
}: TimelineProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  if (variant === "horizontal") {
    return (
      <div className={`w-full ${className}`}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-6 h-0.5 bg-gray-300 dark:bg-gray-600 z-0">
                  <ArrowRight className="absolute -right-2 -top-2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              
              {/* Step Card */}
              <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                {/* Step Number */}
                <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full text-white font-bold text-lg mb-4 mx-auto">
                  {step.isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : step.isActive ? (
                    <Clock className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* Content */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative"
      >
        {/* Progress Line */}
        {showProgress && (
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
        )}
        
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative flex items-start space-x-4"
            >
              {/* Step Indicator */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg
                  ${step.isCompleted 
                    ? 'bg-green-500 text-white' 
                    : step.isActive 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {step.isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : step.isActive ? (
                    <Clock className="w-6 h-6" />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    index + 1
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Timeline;
