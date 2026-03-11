import type { INodeProperties } from 'n8n-workflow';
import { AUTOCOMPLETE_OPTIONS, TIME_RANGES, SAFE_SEARCH_LEVELS, FORMATS } from '../constants';

export const searchOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
      {
        name: 'Search',
        value: 'search',
        description: 'Perform a search query',
        action: 'Perform a search query',
      },
    ],
    default: 'search',
  },
];

export const searchFields: INodeProperties[] = [
  {
    displayName: 'Query',
    name: 'query',
    type: 'string',
    default: '',
    required: true,
    placeholder: 'Enter search query',
    description: 'The search query to perform',
    hint: 'Can be provided directly or via AI agent input',
  },
  {
    displayName: 'Category Names or IDs',
    name: 'categories',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getCategories',
    },
    options: [],
    default: [],
    description: 'Categories to search in. Loaded from your SearXNG instance. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
  },
  {
    displayName: 'Custom Categories',
    name: 'customCategories',
    type: 'string',
    default: '',
    placeholder: 'general,images,custom-category',
    description: 'Additional category names. Use comma-separated values to include categories not listed in presets.',
  },
  {
    displayName: 'Return Single Response',
    name: 'singleResponse',
    type: 'boolean',
    default: false,
    description: 'Whether to return only the content from the first search result as a string',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    options: [
      {
        displayName: 'Language Name or ID',
        name: 'language',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getLanguages',
        },
        options: [],
        default: '',
        description: 'Language of the search results. Loaded from your SearXNG instance. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Time Range',
        name: 'time_range',
        type: 'options',
        options: [...TIME_RANGES],
        default: '',
        description: 'Time range for the search results',
      },
      {
        displayName: 'Safe Search',
        name: 'safesearch',
        type: 'options',
        options: [...SAFE_SEARCH_LEVELS],
        default: '',
        description: 'Safe search level',
      },
      {
        displayName: 'Page Number',
        name: 'pageno',
        type: 'number',
        typeOptions: {
          minValue: 1,
        },
        default: 1,
        description: 'Page number of results',
      },
      {
        displayName: 'Format',
        name: 'format',
        type: 'options',
        options: [...FORMATS],
        default: '',
        description: 'Output format of the search results',
      },
      {
        displayName: 'Engine Names or IDs',
        name: 'engines',
        type: 'multiOptions',
        typeOptions: {
          loadOptionsMethod: 'getEngines',
        },
        options: [],
        default: [],
        description: 'Engines to use for the search. Loaded from your SearXNG instance. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Enabled Plugin Names or IDs',
        name: 'enabled_plugins',
        type: 'multiOptions',
        typeOptions: {
          loadOptionsMethod: 'getPlugins',
        },
        options: [],
        default: [],
        description: 'Plugins to enable for this search. Loaded from your SearXNG instance. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Disabled Plugin Names or IDs',
        name: 'disabled_plugins',
        type: 'multiOptions',
        typeOptions: {
          loadOptionsMethod: 'getPlugins',
        },
        options: [],
        default: [],
        description: 'Plugins to disable for this search. Loaded from your SearXNG instance. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Image Proxy',
        name: 'image_proxy',
        type: 'boolean',
        default: false,
        description: 'Whether to proxy image URLs through SearXNG',
      },
      {
        displayName: 'Autocomplete',
        name: 'autocomplete',
        type: 'options',
        options: [...AUTOCOMPLETE_OPTIONS],
        default: '',
        description: 'Autocomplete backend to use',
      },
    ],
  },
];
