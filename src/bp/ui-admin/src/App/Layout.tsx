import { Alignment, Icon, Navbar } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { StoredToken, UserProfile } from 'common/typings'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { NavLink } from 'reactstrap'
import api from '~/api'
import { getToken, REFRESH_INTERVAL, setToken, tokenNeedsRefresh } from '~/Auth'
import WorkspaceSelect from '~/Pages/Components/WorkspaceSelect'

import logo from '../media/logo_white.png'
import { fetchLicensing } from '../reducers/license'
import { fetchProfile } from '../reducers/user'
import { fetchCurrentVersion } from '../reducers/versions'

import CommandPalette from './CommandPalette'
import Menu from './Menu'
import UserDropdownMenu from './UserDropdownMenu'

interface Props {
  profile: UserProfile
  licensing: any
  version: string
  fetchLicensing: () => void
  fetchProfile: () => void
  fetchCurrentVersion: Function
}

const App: FC<Props> = props => {
  const [tokenInterval, setTokenInterval] = useState()

  useEffect(() => {
    setupBranding()

    props.fetchLicensing()
    props.fetchProfile()

    setTokenInterval(
      setInterval(async () => {
        await tryRefreshToken()
      }, REFRESH_INTERVAL)
    )
  }, [])

  const setupBranding = () => {
    window.document.title = window.APP_NAME || 'Botpress Admin Panel'

    if (window.APP_FAVICON) {
      const link = document.querySelector('link[rel="icon"]')
      link && link.setAttribute('href', window.APP_FAVICON)
    }

    if (window.APP_CUSTOM_CSS) {
      const sheet = document.createElement('link')
      sheet.rel = 'stylesheet'
      sheet.href = window.APP_CUSTOM_CSS
      sheet.type = 'text/css'
      document.head.appendChild(sheet)
    }
  }

  const tryRefreshToken = async () => {
    try {
      if (!tokenNeedsRefresh()) {
        return
      }

      const tokenData = getToken(false) as StoredToken

      const { data } = await api.getSecured().get(`/auth/refresh`)
      const { newToken } = data.payload

      if (newToken !== tokenData.token) {
        setToken(newToken)
        console.log(`Token refreshed successfully`)
      } else {
        clearInterval(tokenInterval)
      }
    } catch (err) {
      console.error(`Error validating & refreshing token`, err)
    }
  }

  if (!props.profile) {
    return null
  }

  const isLicensed = !props.licensing || !props.licensing.isPro || props.licensing.status === 'licensed'

  return (
    <Fragment>
      <Header />
      <CommandPalette />

      <div className="bp-sa-wrapper">
        <Menu />
        <div className="bp-sa-content-wrapper">
          {!isLicensed && <Unlicensed />}
          {props.children}
        </div>
      </div>

      <Footer version={window.APP_VERSION} />
    </Fragment>
  )
}

const Header = () => (
  <header className="bp-header">
    <Navbar>
      <Navbar.Group>
        <Navbar.Heading>
          <a href="admin/">
            <img src={logo} alt="logo" className="bp-header__logo" />
          </a>
        </Navbar.Heading>
      </Navbar.Group>

      <Navbar.Group align={Alignment.RIGHT}>
        <WorkspaceSelect />
        <Navbar.Divider />
        <UserDropdownMenu />
      </Navbar.Group>
    </Navbar>
  </header>
)

const Footer = props => (
  <footer className="statusBar">
    <div className="statusBar-item">{props.version}</div>
  </footer>
)

const Unlicensed = () => (
  <div className="bp-header__warning">
    <NavLink href="/admin/server/license">
      <Icon icon="warning-sign" />
      {lang.tr('admin.botpressIsNotLicensed')}
    </NavLink>
  </div>
)

const mapStateToProps = state => ({
  profile: state.user.profile,
  licensing: state.license.licensing
})

const mapDispatchToProps = {
  fetchLicensing,
  fetchProfile
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
