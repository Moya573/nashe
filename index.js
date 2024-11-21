let altura = 180;
let serie = 0;
let repeticiones = 10;

let device, characteristic;
const debugElement = document.getElementById('debug');

// Implementacion de un logging con auto-scroll para la interfaz de depuración
function log(message) {
    console.log(message);
    debugElement.textContent += message + '\n';
    debugElement.scrollTop = debugElement.scrollHeight; 
}

// Función asíncrona para establecer conexión BLE con el servidor
async function connect() {
    try {
        log('Requesting Bluetooth Device...');

        // Solicitar dispositivo BLE con filtros específicos
        device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'ESP32_GYM' }],
            optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b'] 
        });

        // Establecer conexión GATT con el servidor (ESP32)      
        log('Connecting to GATT Server...');
        const server = await device.gatt.connect();
         
        // Obtener el servicio primario utilizando UUID
        log('Getting Primary Service...');
        const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
        
        // Obtener la característica BLE específica
        log('Getting Characteristic...');
        characteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
        
        // Iniciar las notificaciones para la característica
        log('Starting notifications...');
        await characteristic.startNotifications();
        
        // Configurar el event listener para cambios en la característica
        log('Adding event listener...');
        characteristic.addEventListener('characteristicvaluechanged', handleNotifications);
        
        // Actualizar el estado de la conexión en la UI
        document.getElementById('status').textContent = 'Connected';
        document.getElementById('status').style.color = 'green';
        log('Connected successfully!');

        // Leer el valor inicial de la característica
        log('Reading initial characteristic value...');
        const initialValue = await characteristic.readValue();
        handleNotifications({ target: { value: initialValue } });
    } catch (error) {
        // Manejar de errores de conexión
        console.error('Connection failed', error);
        document.getElementById('status').textContent = 'Connection failed: ' + error.message;
        log('Error: ' + error.message);
    }
}

// Procesar las notificaciones recibidas del servidor BLE
function handleNotifications(event) {
    const value = new TextDecoder().decode(event.target.value);
    log('Received value: ' + value);

    //  Deconstructor para obtener parametros del ejercicio
    [altura, repeticiones, serie] = value.split(',');
    document.getElementById('altura').textContent = altura;
    document.getElementById('repeticiones').textContent = repeticiones;
    if(serie == true){
        document.getElementById('serie').textContent = "Normal";
    }

    if(serie == false){
        document.getElementById('serie').textContent = "Negativa";
    }
}

// Funciones para modificar los parámetros del ejercicio
function Altura(cambio){
    if(altura < 200 & altura >= 0){
        altura = +altura + cambio;
        document.getElementById('altura').textContent = altura;
    }

    writeCaracteristic();
}

function Repeticiones(cambio){
    if(repeticiones >= 0){
        repeticiones = +repeticiones + cambio;
        document.getElementById('repeticiones').textContent = repeticiones;
    }

    writeCaracteristic();
}

function Serie(cambio){
    serie = cambio;
    if(serie == true){
        document.getElementById('serie').textContent = "Normal";
    }

    if(serie == false){
        document.getElementById('serie').textContent = "Negativa";
    }

    writeCaracteristic();
}

// Función asíncrona para escribir en la característica BLE
async function writeCaracteristic() {
    if (characteristic) {
        try {
            await characteristic.writeValue(new TextEncoder().encode(`${altura}, ${repeticiones}, ${serie}`));
            log('Sent');
        } catch (error) {
            log('Error writing to characteristic: ' + error.message);
        }
    } else {
        log('Not connected. Cannot write to characteristic.');
    }
}