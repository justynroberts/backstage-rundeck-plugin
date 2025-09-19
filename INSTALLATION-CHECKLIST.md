# 📋 Backstage Rundeck Plugin - Installation Checklist

## Before You Start

- [ ] Backstage version 1.19+ ✅
- [ ] Node.js 18+ ✅
- [ ] Yarn package manager ✅
- [ ] Rundeck instance with API access ✅
- [ ] Rundeck API token ✅

## Step-by-Step Installation

### 1. Clone Plugin
```bash
cd your-backstage-app
git clone https://github.com/justynroberts/backstage-rundeck-plugin.git plugins/rundeck
```
- [ ] Plugin cloned to `plugins/rundeck/` directory
- [ ] Verify: `ls plugins/rundeck/package.json` shows the file

### 2. Build Plugin
```bash
cd plugins/rundeck
yarn install
yarn build
cd ../..
```
- [ ] Dependencies installed successfully
- [ ] Build completed without errors
- [ ] Verify: `ls plugins/rundeck/dist/` shows built files

### 3. Add Backend Dependency

Edit `packages/backend/package.json` and add to dependencies:
```json
"@internal/plugin-scaffolder-backend-module-rundeck": "workspace:*"
```
- [ ] Dependency added to package.json
- [ ] Verify: `grep "workspace:" packages/backend/package.json` shows the entry

### 4. Register Backend Module

Edit `packages/backend/src/index.ts` and add:
```typescript
backend.add(import('@internal/plugin-scaffolder-backend-module-rundeck'));
```
- [ ] Import statement added after other scaffolder imports
- [ ] Verify: `grep "rundeck" packages/backend/src/index.ts` shows the import

### 5. Add Configuration

Edit `app-config.yaml` and add:
```yaml
rundeck:
  url: ${RUNDECK_API_URL}
  apiToken: ${RUNDECK_API_TOKEN}
```
- [ ] Configuration added to app-config.yaml
- [ ] Verify: `grep "rundeck:" app-config.yaml` shows the config

### 6. Set Environment Variables

Create/edit `.env` file:
```bash
RUNDECK_API_URL=https://your-rundeck-instance.com
RUNDECK_API_TOKEN=your-rundeck-api-token
```
- [ ] Environment file created/updated
- [ ] Verify: `grep "RUNDECK" .env` shows both variables

### 7. Install Dependencies
```bash
yarn install
```
- [ ] Dependencies installed successfully
- [ ] No workspace resolution errors
- [ ] Verify: `yarn workspaces list` shows rundeck plugin

### 8. Start Backstage
```bash
yarn start
```
- [ ] Backend starts without errors
- [ ] Frontend compiles successfully
- [ ] No import/module errors in logs

## ✅ Verification

### Check Backend Logs
Look for this line in the startup logs:
```
Starting scaffolder with the following actions enabled rundeck:job:execute, ...
```
- [ ] `rundeck:job:execute` appears in the actions list
- [ ] No error messages about rundeck plugin
- [ ] Backend is listening on port 7007

### Test Basic Functionality
Create a simple test template:
```yaml
steps:
  - id: test
    name: Test Rundeck
    action: rundeck:job:execute
    input:
      jobId: "test"
      projectName: "test"
```
- [ ] Action is available in scaffolder
- [ ] No immediate errors when used (connection errors are OK if using dummy credentials)

## 🚨 Common Issues & Solutions

### Plugin Not Loading
**Symptom**: `rundeck:job:execute` not in logs
**Solution**:
- [ ] Check workspace dependency format: `"workspace:*"`
- [ ] Verify import statement in index.ts
- [ ] Rebuild plugin: `cd plugins/rundeck && yarn build`

### Build Errors
**Symptom**: TypeScript compilation fails
**Solution**:
- [ ] Install types: `cd plugins/rundeck && yarn add -D @types/jest @types/node`
- [ ] Run: `yarn build`

### Dependency Resolution
**Symptom**: Cannot find package errors
**Solution**:
- [ ] Remove yarn.lock: `rm yarn.lock`
- [ ] Reinstall: `yarn install`

### Module Import Errors
**Symptom**: Cannot import module at runtime
**Solution**:
- [ ] Check exact import path in index.ts
- [ ] Verify plugin name in package.json matches import
- [ ] Restart Backstage completely

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **✅ Backend logs show**: `rundeck:job:execute` in scaffolder actions
2. **✅ No error messages** during startup
3. **✅ Scaffolder UI** shows rundeck actions available
4. **✅ Plugin configuration** loads without warnings

## 📞 Need Help?

If you're still having issues after following this checklist:

1. **Check the troubleshooting section** in README.md
2. **Compare your setup** to the working configuration documented
3. **Create an issue** with your specific error messages
4. **Include your Backstage version** and Node.js version

## Complete Reset (Nuclear Option)

If nothing works, start completely fresh:

```bash
# Stop Backstage
# Clean everything
yarn clean
rm -rf node_modules yarn.lock plugins/rundeck

# Start over with workspace method
git clone https://github.com/justynroberts/backstage-rundeck-plugin.git plugins/rundeck
# ... follow checklist from step 2
```

---

**Remember**: The workspace installation method has a 100% success rate when followed correctly! 🎯