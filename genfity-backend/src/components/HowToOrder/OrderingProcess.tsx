"use client";

import { motion } from "framer-motion";
import { ShoppingCart, FileText, Gift, CheckSquare, CreditCard, DollarSign, Smartphone, BarChart3 } from "lucide-react";
import Timeline from "./Timeline";
import { useTranslations } from "next-intl";

const OrderingProcess = () => {  const t = useTranslations("HowToOrder");

  const orderingSteps = [
    {
      title: t("orderingProcess.steps.addToCart.title"),
      description: t("orderingProcess.steps.addToCart.description"),
      icon: <ShoppingCart className="w-6 h-6" />,
    },
    {
      title: t("orderingProcess.steps.fillForm.title"),
      description: t("orderingProcess.steps.fillForm.description"),
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: t("orderingProcess.steps.voucher.title"),
      description: t("orderingProcess.steps.voucher.description"),
      icon: <Gift className="w-6 h-6" />,
    },
    {
      title: t("orderingProcess.steps.verifyOrder.title"),
      description: t("orderingProcess.steps.verifyOrder.description"),
      icon: <CheckSquare className="w-6 h-6" />,
    },
    {
      title: t("orderingProcess.steps.checkout.title"),
      description: t("orderingProcess.steps.checkout.description"),
      icon: <CreditCard className="w-6 h-6" />,
    },
    {
      title: t("orderingProcess.steps.payment.title"),
      description: t("orderingProcess.steps.payment.description"),
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      title: t("orderingProcess.steps.pay.title"),
      description: t("orderingProcess.steps.pay.description"),
      icon: <Smartphone className="w-6 h-6" />,
    },
    {
      title: t("orderingProcess.steps.checkStatus.title"),
      description: t("orderingProcess.steps.checkStatus.description"),
      icon: <BarChart3 className="w-6 h-6" />,
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
            {t("orderingProcess.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("orderingProcess.subtitle")}
          </p>
        </motion.div>

        <Timeline 
          steps={orderingSteps} 
          variant="horizontal"
          className="mb-8"
        />
        
        {/* Mobile View - Vertical Timeline */}
        <div className="lg:hidden">
          <Timeline 
            steps={orderingSteps} 
            variant="vertical"
          />
        </div>
      </div>
    </section>
  );
};

export default OrderingProcess;
