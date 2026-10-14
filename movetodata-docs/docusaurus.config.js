// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
require("dotenv").config();
const isBrowser = typeof window !== "undefined";

// const apiHost = location.protocol + "//" + location.host;

const siteUrl = isBrowser ? window.location.origin : "https://dev.movetodata.io";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "MoveToData Documentation",
  tagline: "",
  favicon: "img/favicon.ico",

  stylesheets: [
    '/css/popup.css', // Adjust the path to your CSS file
  ],
  scripts: [
    {
      src: '/js/popup.js', // Adjust the path to your JS file
      async: true, // Optional, for asynchronous loading
    },
  ],

  // Set the production url of your site here
  // url: "process.env.BASE_URL",
  url: siteUrl,
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/learn/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "movetodata", // Usually your GitHub org/user name.
  projectName: "movetodata-docs", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    localeConfigs: {
      en: {
        label: "English",
        direction: "ltr",
        htmlLang: "en-US",
        calendar: "gregory",
        path: "en",
      },
      fr: {
        label: "Français",
        direction: "ltr",
        htmlLang: "fr-fr",
        calendar: "gregory",
        path: "fr",
      },
    },
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          breadcrumbs: false,
          include: ['**/*.md', '**/*.mdx'], 
        },
        // blog: {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        // },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/logo.jpg",
      // docs: {
      //   sidebar: {
      //     hideable: true,
      //   },
      // },
      // docs: {
      //   sidebar: {
      //     autoCollapseCategories: true,
      //   },
      // },

      colorMode: {
        defaultMode: "light",
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      navbar: {
        title: "MoveToData",
        logo: {
          alt: "MoveToData Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "localeDropdown",
            position: "right",
          },

          {
            to: "/docs/getting_started/intro",
            label: "Docs",
            position: "left",
          },
          {
            to: "/docs/tutorials/overview",
            label: "Tutorials",
            position: "left",
          },
          {
            to: "/docs/release_notes",
            label: "Release Notes",
            position: "left",
          },
          {
            to: "/api-catalog",
            label: "API",
            position: "left",
          },
          // {
          //   to: "/",
          //   label: "Back to MoveToData",
          //   position: "right",
          // },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            label: "Documentation",
            to: "/docs/getting_started/intro",
          },
          {
            label: "Recent Releases",
            href: "#",
          },
          {
            label: "Security",
            href: "#",
          },
          {
            label: "ReleaseNotes",
            to: "/docs/release_notes",
          },
          // {
          //   label: "Back to MoveToData",
          //   to: "/",
          // },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} MoveToData`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
