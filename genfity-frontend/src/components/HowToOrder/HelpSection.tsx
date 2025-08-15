"use client";

import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const HelpSection = () => {
  const t = useTranslations("HowToOrder");

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "WhatsApp",
      description: "Quick response via WhatsApp",
      action: "Chat Now",
      href: "https://wa.me/6281234567890", // Replace with actual WhatsApp number
      color: "green",
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Detailed support via email",
      action: "Send Email",
      href: "mailto:support@genfity.com", // Replace with actual email
      color: "blue",
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Call",
      description: "Direct phone consultation",
      action: "Call Now",
      href: "tel:+6281234567890", // Replace with actual phone number
      color: "purple",
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
        >
          <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t("needHelp.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("needHelp.description")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                href={method.href}
                className="block bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group h-full"
              >
                <div className="text-center">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform duration-300 group-hover:scale-110
                    ${method.color === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : ''}
                    ${method.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}
                    ${method.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' : ''}
                  `}>
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {method.description}
                  </p>
                  <div className={`
                    inline-flex items-center px-6 py-3 rounded-full font-semibold transition-colors duration-300
                    ${method.color === 'green' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                    ${method.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                    ${method.color === 'purple' ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}
                  `}>
                    {method.action}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Looking for quick answers? Check our frequently asked questions.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-full font-semibold transition-colors duration-300"
          >
            <HelpCircle className="w-5 h-5 mr-2" />
            Visit FAQ
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HelpSection;
