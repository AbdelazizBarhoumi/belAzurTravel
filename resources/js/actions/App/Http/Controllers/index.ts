import BrowserLogController from './BrowserLogController'
import Api from './Api'
import Admin from './Admin'
import Settings from './Settings'
const Controllers = {
    BrowserLogController: Object.assign(BrowserLogController, BrowserLogController),
Api: Object.assign(Api, Api),
Admin: Object.assign(Admin, Admin),
Settings: Object.assign(Settings, Settings),
}

export default Controllers