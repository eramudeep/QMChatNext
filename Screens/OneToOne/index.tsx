import React from 'react'
import {SafeAreaView, StyleSheet, Text, View} from 'react-native'
import withRedux from 'HOCs/withRedux'

interface OneToOneProps {
  route?: {
    params?: {
      chatId?: string;
      receiver?: Record<string, any>;
    };
  };
  user?: {
    myProfile?: Record<string, any>;
    blockedUsersIds?: string[];
  };
}

function OneToOne({route, user: _user}: OneToOneProps) {
  const chatId = route?.params?.chatId

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Next Generation Chat ({chatId ?? 'Direct'})</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
})

export default withRedux(OneToOne)
