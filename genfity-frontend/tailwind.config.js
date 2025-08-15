/** @type {import('tailwindcss').Config} */

const colors = require("tailwindcss/colors");
import svgToDataUri from "mini-svg-data-uri";

const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

module.exports = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: "class",
	theme: {
		container: {
			center: true,
			padding: "1rem",
		},

		screens: {
		xs: "450px",
		// => @media (min-width: 450px) { ... }

		sm: "575px",
		// => @media (min-width: 576px) { ... }

		md: "768px",
		// => @media (min-width: 768px) { ... }

		lg: "992px",
		// => @media (min-width: 992px) { ... }

		xl: "1200px",
		// => @media (min-width: 1200px) { ... }

		"2xl": "1400px",
		// => @media (min-width: 1400px) { ... }
		},
		extend: {
			colors: {
				current: "currentColor",
				transparent: "transparent",
				white: "#FFFFFF",
				black: "#000000",
				dark: "#101010",
				background: "var(--background)",
				primary: {
					DEFAULT: "#0D46A0",
					dark: "#1F69E0",
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: "#ECF0FE",
					foreground: 'hsl(var(--secondary-foreground))'
				},
				yellow: "#FBB040",
				"bg-color-dark": "#171C28",
				"body-color": {
					DEFAULT: "#788293",
					dark: "#959CB1",
				},
				stroke: {
					stroke: "#E3E8EF",
					dark: "#353943",
				},
				gray: {
					...colors.gray,
					dark: '#101010',
					light: '#F0F2F9'
				},
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
				}
			},

			boxShadow: {
				signUp: "0px 5px 10px rgba(4, 10, 34, 0.2)",
				one: "0px 2px 3px rgba(7, 7, 77, 0.05)",
				two: "0px 5px 10px rgba(6, 8, 15, 0.1)",
				three: "0px 5px 15px rgba(6, 8, 15, 0.05)",
				sticky: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)",
				"sticky-dark": "inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)",
				"feature-2": "0px 10px 40px rgba(48, 86, 211, 0.12)",
				submit: "0px 5px 20px rgba(4, 10, 34, 0.1)",
				"submit-dark": "0px 5px 20px rgba(4, 10, 34, 0.1)",
				btn: "0px 1px 2px rgba(4, 10, 34, 0.15)",
				"btn-hover": "0px 1px 2px rgba(0, 0, 0, 0.15)",
				"btn-light": "0px 1px 2px rgba(0, 0, 0, 0.1)",
			},
			dropShadow: {
				three: "0px 5px 15px rgba(6, 8, 15, 0.05)",
			},
			animation: {
				scroll:
				"scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
				marquee: "marquee var(--duration, 30s) linear infinite",
			},

			keyframes: {
				scroll: {
					to: {
						transform: "translate(calc(-50% - 0.5rem))",
					},
				},
				marquee: {
					to: { transform: "translateX(-50%)" },
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
  			}
		},
	},
	plugins: [
		addVariablesForColors,
		function ({ matchUtilities, theme }) {
			matchUtilities(
				{
				"bg-grid": (value) => ({
					backgroundImage: `url("${svgToDataUri(
					`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
					)}")`,
				}),
				},
				{ values: flattenColorPalette(theme("backgroundColor")), type: "color" }
			);
		},
		require("tailwindcss-animate")
	],
};

function addVariablesForColors({ addBase, theme }) {
	let allColors = flattenColorPalette(theme("colors"));
	let newVars = Object.fromEntries(
		Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
	);

	addBase({
		":root": newVars,
	});
}