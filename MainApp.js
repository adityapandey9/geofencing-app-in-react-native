import React, { Component } from 'react'

import { createAppContainer, createStackNavigator } from 'react-navigation';

import HomeView from './App';
import ListView from './layout';

const RootStack = createAppContainer(createStackNavigator({
      home: {
        screen: HomeView
      },
      list: {
          screen: ListView
      }
    }, {
        headerMode: 'none',
        navigationOptions: {
            headerVisible: false,
        }
    }));

class MainApp extends React.Component {

  render() {

        return (
            <RootStack />
        )
    }
}



export default MainApp;

