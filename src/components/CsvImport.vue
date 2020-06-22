<template>
  <div :class="{ 'is-dragover': isDragover }">
    <div class="form-group">
      <div
        class="file-upload bg-light"
        @dragover.prevent="handleDragover"
        @dragenter.prevent="handleDragover"
        @dragleave.prevent="handleDragleave"
        @dragend.prevent="handleDragleave"
        @drop.prevent="handleDrop"
      >
        <label>
          <svg class="file-upload--icon" xmlns="http://www.w3.org/2000/svg" width="50" height="43" viewBox="0 0 50 43">
            <path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z"></path>
          </svg>
          <input ref="file" type="file" @change.prevent="handleChange" class="form-control-file file-upload--input" :files="droppedFiles" :name="name">
          <span class="text-muted" v-if="fileName">{{ fileName }}</span>
          <span class="text-muted" v-else>Drag and drop a file here or click</span>
        </label>

        <div class="error mt-2 text-danger" v-if="errorMessage">
          {{ errorMessage }}
        </div>
      </div>
    </div>

    <div class="form-group" v-if="sample">
      <table class="table">
        <thead>
          <tr>
            <th>Field</th>
            <th>CSV Column</th>
          </tr>
        </thead>
        <tbody>
        <tr v-for="(field, key) in fieldsToMap" :key="key">
          <td>{{ field.label }}</td>
          <td>
            <select class="form-control" :name="`${mapFieldsName}[${field.key}]`" v-model="map[field.key]">
              <option :value="null"></option>
              <option v-for="(column, key) in firstRow" :key="key" :value="key">{{ column }}</option>
            </select>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue';
  import { drop, every, forEach, get, isArray, map, set } from 'lodash';
  import Papa from 'papaparse';
  import mimeTypes from 'mime-types';

  export default {
    name: 'ui-csv-import',
    props: {
      name: {
        type: String,
        required: true
      },
      error: {
        type: String
      },
      mapFields: {
        required: true
      },
      mapFieldsName: {
        type: String,
        default: 'fields'
      },
      fileMimeTypes: {
        type: Array,
        default: () => {
          return ['text/csv', 'text/x-csv', 'application/vnd.ms-excel', 'text/plain'];
        }
      }
    },
    data () {
      return {
        inputMapFields: JSON.parse(this.mapFields),
        isDragover: false,
        droppedFiles: null,
        fileName: null,
        fileSelected: false,
        isValidFileMimeType: false,
        fieldsToMap: [],
        sample: null,
        map: {},
        errorMessage: this.error
      }
    },
    created() {
      const mapFields = JSON.parse(this.mapFields);

      if (isArray(mapFields)) {
        this.fieldsToMap = map(mapFields, (item) => ({
          key: item,
          label: item
        }));
      } else {
        this.fieldsToMap = map(mapFields, (label, key) => ({
          key: key,
          label: label
        }));
      }
    },
    methods: {
      handleDragover () {
        this.isDragover = true;
      },
      handleDragleave () {
        this.isDragover = false;
      },
      handleDrop (e) {
        this.isDragover = false;
        this.droppedFiles = e.dataTransfer.files;

        this.$nextTick(() => {
          const event = new Event('change');
          Object.defineProperty(event, 'target', { writable: false, value: { files: this.droppedFiles } });

          this.$refs.file.dispatchEvent(event);
        })
      },
      handleChange (e) {
        const file = e.target.files[0];

        if (file) {
          const mimeType = file.type === '' ? mimeTypes.lookup(file.name) : file.type;

          this.fileSelected = true;
          this.isValidFileMimeType = this.validateMimeType(mimeType);
        } else {
          this.isValidFileMimeType = false;
          this.fileSelected = false;
        }

        if (this.isValidFileMimeType) {
          this.loadSampleData(file);
          this.errorMessage = null;
          this.fileName = file.name;
        } else {
          this.sample = null;
          this.fileName = null;
          this.errorMessage = 'File type is invalid.';
        }
      },
      validateMimeType(type) {
        return this.fileMimeTypes.indexOf(type) > -1;
      },
      loadSampleData (file) {
        this.readFile(file, (output) => {
          this.sample = get(Papa.parse(output, { preview: 2, skipEmptyLines: true }), 'data');
        });
      },
      readFile (file, callback) {
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (e) => callback(e.target.result);
        reader.onerror = () => {};
      }
    },
    computed: {
      firstRow () {
        return get(this, 'sample.0');
      }
    }
  }
</script>

<style lang="scss">
.file-upload {
  outline: 2px dashed #dee2e6;
  outline-offset: -5px;
  position: relative;
  padding: 70px 20px;
  text-align: center;
  transition: outline-offset .15s ease-in-out, background-color .15s linear;

  label {
    max-width: 80%;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    display: inline-block;
    overflow: hidden;
  }

  .file-upload--icon {
    width: 100%;
    height: 80px;
    fill: #dee2e6;
    display: block;
    margin-bottom: 40px;
  }

  .file-upload--input {
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
  }
}

.is-dragover {
  .file-upload {
    outline-offset: -10px;
    outline-color: #c8dadf;
    background-color: #fff;
  }
}
</style>
