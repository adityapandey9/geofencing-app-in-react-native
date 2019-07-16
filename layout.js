import React, { Component } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

class Layout extends Component {

    constructor(props){
        super(props);
        this.state = {
            data: null
        }
    }

    componentDidMount(){
        const { navigation } = this.props;
        const itemId = navigation.getParam('data', null);
        this.setState({data: itemId});
    }

    render(){
        let { data } = this.state;
        if(data != null)
          data = data.reverse();
        else
          return <Text style={styles.subinfo}>No, data has found</Text>

        console.log("No Data: ", data)
        return (
          <View
          style={[
            styles.Container,
            {borderColor: "blue", borderWidth: 0}
          ]}
          >
            <FlatList 
              style={[{borderColor: "blue", borderWidth: 0}]}
              data={data}
              renderItem={({item}) => <View><Text style={styles.subinfo}>{item.key}</Text></View>}
            />
        </View>
        )
    }

}

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: 'white',
        flexDirection: "column",
        width: "100%"
      },
      subinfo: {
        fontSize: 17,
        color: "#fff",
        margin: 5,
        padding: 5,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 6,
        fontWeight: "bold",
        elevation: 3,
        backgroundColor: "#79abfc"
      }
});

export default Layout;