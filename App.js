import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  ToastAndroid
} from "react-native";

import MapView, {
  Marker,
  AnimatedRegion,
  Polyline,
  Circle,
  PROVIDER_GOOGLE
} from "react-native-maps";

import { withNavigation } from 'react-navigation';

import haversine from "haversine";

import { isPointWithinRadius } from "geolib";

import AsyncStorage from '@react-native-community/async-storage';

import { LIST } from './const';

const LATITUDE_DELTA = 0.00922*1.5;
const LONGITUDE_DELTA = 0.00421*1.5;
const LATITUDE = 22.6658434;
const LONGITUDE = 88.37342740000001;
const RADIUS = 30

class AnimatedMarkers extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      latitude: LATITUDE,
      longitude: LONGITUDE,
      routeCoordinates: [],
      distanceTravelled: 0,
      prevLatLng: {},
      coordinate: new AnimatedRegion({
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: 0,
        longitudeDelta: 0
      }),
      centerlat: 0,
      centerlon: 0,
      isgranted: false,
      locationinfo: []
    };
    this.watchID = null;
    this.isinfencing = true;
  }

  static navigationOptions = ({ navigation }) => {
    return {
       header: () => null
    } 
  }

  componentDidMount() {
    this.getData(LIST, (val)=>{
      console.log("Data: ", val)
      if(val != null)
        this.setState({locationinfo: JSON.parse(val)});
    })

    this.requestLocationPermission();
    if(this.state.isgranted == true){
      this.addWatch();
    }
    this.props.navigation.setParams({
      hideHeader: true,
    });
  }

  getData = async (key, fn) => {
    try {
      const value = await AsyncStorage.getItem(key)
      // value previously stored
      fn(value);
    } catch(e) {
      // error reading value
      console.log("Error: ", e);
    }
  }

  //Storing Data
  storeData = async (key, val) => {
    try {
      await AsyncStorage.setItem(key, val)
    } catch (e) {
      // saving error
      console.log(e)
      ToastAndroid.show("Some error occured during storing", 500);
    }
  }
  
  addWatch = () => {
    this.watchID = navigator.geolocation.watchPosition(
      position => {
        const { routeCoordinates, distanceTravelled } = this.state;
        const { latitude, longitude } = position.coords;

        const newCoordinate = {
          latitude,
          longitude
        };
        console.log({ newCoordinate });
        if(!isPointWithinRadius(position.coords, {latitude: this.state.centerlat, longitude: this.state.centerlon}, RADIUS) && this.state.centerlat != 0 && this.state.centerlon != 0 && this.isinfencing == true){
          console.log("Yes, outside of the box");
          let val = this.state.locationinfo;
          if(val == null)
            val = []
          val.push({key: new Date().toString()});  
          this.setState({
            locationsinfo: val
          }, ()=>{
            this.storeData(LIST, JSON.stringify(val));
            ToastAndroid.show("You are outside of the fencing", 500);
            this.isinfencing = false;
          });
        } else {
          console.log("Within the Circle Area");
          this.isinfencing = true;
        }

        if (Platform.OS === "android") {
          if (this.marker) {
            this.marker._component.animateMarkerToCoordinate(
              newCoordinate,
              500
            );
          }
        } else {
          coordinate.timing(newCoordinate).start();
        }

        this.setState({
          latitude,
          longitude,
          routeCoordinates: routeCoordinates.concat([newCoordinate]),
          distanceTravelled:
            distanceTravelled + this.calcDistance(newCoordinate),
          prevLatLng: newCoordinate
        });
      },
      error => console.log(error),
      {
        enableHighAccuracy: true,
        timeout: 60e3,
        maximumAge: 10e3,
        distanceFilter: 18,
        useSignificantChanges: false
      }
    );
  }

  addFencing = ()=>{
    navigator.geolocation.getCurrentPosition(position=>{
      this.setState({centerlat: position.coords.latitude, centerlon: position.coords.longitude}, ()=>{
        ToastAndroid.show("Fencing Created", 500);
      })
    }, err=>{
      console.log("Eror: ", err);
      ToastAndroid.show("Error, happened cannot create fencing", 500);
    }, {
      enableHighAccuracy: true,
      timeout: 60e3,
      maximumAge: 10e3,
      distanceFilter: 18,
      useSignificantChanges: false
    })
  }

  componentWillUnmount() {
    if(this.watchID != null)
      navigator.geolocation.clearWatch(this.watchID);
  }

  getMapRegion = () => ({
    latitude: this.state.latitude,
    longitude: this.state.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA
  });

  calcDistance = newLatLng => {
    const { prevLatLng } = this.state;
    return haversine(prevLatLng, newLatLng) || 0;
  };

  requestLocationPermission = async () => {
    try {
      PermissionsAndroid.PERMISSIONS
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Access Permission",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the location");
        this.setState({isgranted: true}, ()=>{
          this.addWatch();
        });
      } else {
        console.log("Location permission denied");
        this.setState({isgranted: false})
        ToastAndroid.show("If not granted appp will not work", 500);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  render() {
    if(this.state.isgranted == false){
      this.requestLocationPermission();
      return <View><Text>We need permission to operate this app</Text></View>
    }
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showUserLocation
          followUserLocation
          loadingEnabled
          showsScale={true}
          showsCompass={true}
          minZoomLevel={18}
          region={this.getMapRegion()}
        >
          <Polyline coordinates={this.state.routeCoordinates} strokeWidth={5} />
          <Circle center={{latitude: this.state.centerlat, longitude: this.state.centerlon}} radius={RADIUS} />
          <Marker.Animated
            ref={marker => {
              this.marker = marker;
            }}
            coordinate={this.state.coordinate}
          />
        </MapView>
        <View style={[{width: "100%", flexDirection: "column", backgroundColor: "transparent"}]}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.bubble, styles.button, {backgroundColor: "white"}]} 
              onPress={()=>{
                this.addFencing();
              }}
              >
              <Text style={styles.bottomBarContent}>
                Add Geofencing here
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bubble, styles.button]}>
              <Text style={styles.bottomBarContent}>
                {parseFloat(this.state.distanceTravelled).toFixed(2)} km
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.bubble, styles.button, {margin: 5, elevation: 4, backgroundColor: "white"}]} 
                onPress={()=>{
                  this.props.navigation.navigate('list', {
                    data: this.state.locationinfo
                  });
                }}>
                  <Text style={styles.bottomBarContent}>
                    Open Fencing log
                  </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  bubble: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20
  },
  latlng: {
    width: 200,
    alignItems: "stretch"
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: "center",
    marginHorizontal: 10
  },
  buttonContainer: {
    flexDirection: "row",
    // marginVertical: 50,
    backgroundColor: "transparent"
  }
});

export default AnimatedMarkers;
