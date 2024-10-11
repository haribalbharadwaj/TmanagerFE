import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv'; //REACT_APP_TASK_manager_BACKEND_URL=http://localhost:4000

dotenv.config();

export default defineConfig({
  plugins: [react(),
    replace({
      preventAssignment: true,
      values: {
        'process.env.REACT_APP_TASK_manager_BACKEND_URL': JSON.stringify(process.env.REACT_APP_TASK_manager_BACKEND_URL),
      },
    }),
  ],
})
