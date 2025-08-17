"use client";

import { motion } from "framer-motion";
import { Package, MessageCircle, Wrench, Truck } from "lucide-react";
import Timeline from "./Timeline";
import { useTranslations } from "next-intl";

const MainWorkflow = () => {
  const t = useTranslations("HowToOrder");

  const workflowSteps = [
    {
      title: t("mainWorkflow.steps.orderReceived.title"),
      description: t("mainWorkflow.steps.orderReceived.description"),
      icon: <Package className="w-6 h-6" />,
    },
    {
      title: t("mainWorkflow.steps.whatsappContact.title"),
      description: t("mainWorkflow.steps.whatsappContact.description"),
      icon: <MessageCircle className="w-6 h-6" />,
    },
    {
      title: t("mainWorkflow.steps.workExecution.title"),
      description: t("mainWorkflow.steps.workExecution.description"),
      icon: <Wrench className="w-6 h-6" />,
    },
    {
      title: t("mainWorkflow.steps.delivery.title"),
      description: t("mainWorkflow.steps.delivery.description"),
      icon: <Truck className="w-6 h-6" />,
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t("mainWorkflow.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("mainWorkflow.subtitle")}
          </p>
        </motion.div>

        <Timeline 
          steps={workflowSteps} 
          variant="vertical"
          className="max-w-4xl mx-auto"
        />
      </div>
    </section>
  );
};

export default MainWorkflow;
