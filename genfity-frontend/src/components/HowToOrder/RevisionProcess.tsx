"use client";

import { motion } from "framer-motion";
import { Users, Edit, RefreshCw } from "lucide-react";
import Timeline from "./Timeline";
import { useTranslations } from "next-intl";

const RevisionProcess = () => {
  const t = useTranslations("HowToOrder");

  const revisionSteps = [
    {
      title: t("revisionProcess.steps.meetings.title"),
      description: t("revisionProcess.steps.meetings.description"),
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: t("revisionProcess.steps.revisionRequests.title"),
      description: t("revisionProcess.steps.revisionRequests.description"),
      icon: <Edit className="w-6 h-6" />,
    },
    {
      title: t("revisionProcess.steps.processing.title"),
      description: t("revisionProcess.steps.processing.description"),
      icon: <RefreshCw className="w-6 h-6" />,
    },
  ];

  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t("revisionProcess.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("revisionProcess.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Timeline 
              steps={revisionSteps} 
              variant="vertical"
              showProgress={false}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 rounded-2xl p-8"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Flexible Revision Policy
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We understand that projects may need adjustments. Our revision process ensures that your final product meets your exact requirements while maintaining quality and timeline efficiency.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RevisionProcess;
