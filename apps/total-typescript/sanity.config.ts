import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import deskStructure from './schemas/deskStructure'
import {codeInput} from '@sanity/code-input'
import {cloudinarySchemaPlugin} from 'sanity-plugin-cloudinary'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'

export default defineConfig({
  name: 'default',
  title: 'Total TypeScript',
  projectId: 'z9io1e0u',
  dataset: 'production',
  plugins: [
    deskTool({structure: deskStructure}),
    visionTool(),
    codeInput(),
    cloudinarySchemaPlugin(),
    taxonomyManager(),
  ],
  schema: {
    types: schemaTypes,
  },
})