import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SimpleAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

export default function SimpleAlert({
  visible,
  type,
  title,
  message,
  onClose,
}: SimpleAlertProps) {
  if (!visible) {
    console.log('SimpleAlert: Not visible, returning null');
    return null;
  }
  
  console.log('SimpleAlert: Rendering alert with type:', type, 'title:', title);

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle',
          backgroundColor: '#d4edda',
          borderColor: '#28a745',
          iconColor: '#28a745',
          textColor: '#155724',
        };
      case 'error':
        return {
          icon: 'exclamation-circle',
          backgroundColor: '#f8d7da',
          borderColor: '#dc3545',
          iconColor: '#dc3545',
          textColor: '#721c24',
        };
      case 'warning':
        return {
          icon: 'exclamation-triangle',
          backgroundColor: '#fff3cd',
          borderColor: '#ffc107',
          iconColor: '#ffc107',
          textColor: '#856404',
        };
      case 'info':
        return {
          icon: 'info-circle',
          backgroundColor: '#d1ecf1',
          borderColor: '#17a2b8',
          iconColor: '#17a2b8',
          textColor: '#0c5460',
        };
      default:
        return {
          icon: 'info-circle',
          backgroundColor: '#d1ecf1',
          borderColor: '#17a2b8',
          iconColor: '#17a2b8',
          textColor: '#0c5460',
        };
    }
  };

  const config = getAlertConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome5
            name={config.icon}
            size={20}
            color={config.iconColor}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.textColor }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: config.textColor }]}>
            {message}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome5 name="times" size={16} color={config.textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10000,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    minHeight: 60,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    flexShrink: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
